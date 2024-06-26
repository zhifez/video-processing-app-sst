import { ScaleMetric, StatusType } from '@/schemas/types';
import { VideoProcessingConfigType } from '@/schemas/videos-api-schemas';
import { dynamo, s3 } from '@/app/api/utils';
import { getFfmpegScaleAlgo, streamToBuffer } from '@/utils/utils';
import { UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { SQSEvent } from 'aws-lambda';
import { execFile } from 'child_process';
import { createWriteStream, readFileSync } from 'fs';
import { Resource } from 'sst';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { baselimeLogger } from './utils';
import { differenceInMilliseconds } from 'date-fns';

const FFMPEG_PATH = '/opt/ffmpeg/ffmpeg';
const LOG_NAMESPACE = 'video-processing-service';

const logger = baselimeLogger(LOG_NAMESPACE);
const logRequestId = crypto.randomUUID();

const downloadFromS3 = async (Key: string, videoFilePath: string) => {
  const { Body } = await s3.send(new GetObjectCommand({
    Bucket: Resource.UserVideoBucket.name,
    Key,
  }));
  if (Body instanceof Readable) {
    await pipeline(
      Body,
      createWriteStream(videoFilePath)
    );
  } else {
    throw new Error('Expected a stream for Body');
  }
};

const executeFfmpeg = (inputFilePath: string, outputFilePath: string, config: VideoProcessingConfigType) => {
  const commands = [
    // Convert to different format
    '-i',
    inputFilePath,
    // Reduce file size (source: https://unix.stackexchange.com/a/447521)
    ...(config.nextScaleMetric !== ScaleMetric.Full ? [
      '-vf',
      getFfmpegScaleAlgo(config.nextScaleMetric),
    ] : []),
    outputFilePath,
  ];

  return new Promise((resolve, reject) => {
    execFile(
      FFMPEG_PATH,
      commands,
      (error, stdout, stderr) => {
        if (error) {
          return reject(error);
        }
        resolve({ stdout, stderr });
      }
    );
  });
};

const uploadToS3 = async (Key: string, outputFilePath: string,) => {
  const fileContent = readFileSync(outputFilePath);
  await s3.send(new PutObjectCommand({
    Bucket: Resource.UserVideoBucket.name,
    Key,
    Body: fileContent,
  }));
};

const deleteFromS3 = async (Key: string) => {
  await s3.send(new DeleteObjectCommand({
    Bucket: Resource.UserVideoBucket.name,
    Key,
  }));
};

const updateRequestStatus = (
  requestId: string,
  statusType: StatusType,
  message: string,
) => dynamo.send(new UpdateItemCommand({
  TableName: Resource.VideoRequestTable.name,
  Key: {
    'userId': { S: 'NO_USER' },
    'requestId': { S: requestId },
  },
  // Note: Using attribute name because status is a reserved keyword
  UpdateExpression: 'set #statusCol = :newStatus, message = :message',
  ExpressionAttributeNames: {
    '#statusCol': 'status',
  },
  ExpressionAttributeValues: {
    ':newStatus': { S: statusType },
    ':message': { S: message, },
  },
}));

export const handler = async (event: SQSEvent) => {
  console.log('//----- Video Processing Start -----//');
  const startTime = Date.now();

  // Download and parse config file from bucket
  const queueData = JSON.parse(event.Records[0].body);
  const requestId = queueData.requestId;
  let config: VideoProcessingConfigType | null = null;
  try {
    const { Body } = await s3.send(new GetObjectCommand({
      Bucket: Resource.UserVideoBucket.name,
      Key: `${requestId}/config.json`,
    }));
    const jsonBuffer = await streamToBuffer(Body as Readable);
    config = JSON.parse(jsonBuffer.toString());
    console.log('Config file downloaded successfully:', { config });
  } catch (error: any) {
    console.log('Error downloading config file:', { error });
    await updateRequestStatus(
      requestId,
      StatusType.FAILED,
      `Error Code: DCFG-${error.code}`,
    );
    await logger([
      {
        requestId: logRequestId,
        message: 'Error downloading or parsing config file',
        error,
        data: {
          videoRequestId: requestId,
        },
      },
    ]);
    return;
  }

  if (!config) {
    console.log('Error parsing config file');
    await updateRequestStatus(
      requestId,
      StatusType.FAILED,
      `Error Code: PCFG`,
    );
    return;
  }

  // Update request status to IN_PROGRESS
  await updateRequestStatus(
    requestId,
    StatusType.IN_PROGRESS,
    'Downloaded and parsed config file',
  );
  console.log('Request status updated to IN_PROGRESS');

  // Download video file from bucket
  const fromExt = config.fromExt;
  const toExt = config.toExt;
  const videoFileName = `input.${fromExt}`;
  const videoFileKey = `${requestId}/${videoFileName}`;
  const videoFilePath = `/tmp/${videoFileName}`;
  const outputFilePath = `/tmp/output.${toExt}`;
  try {
    await downloadFromS3(
      videoFileKey,
      videoFilePath,
    );
    console.log('Video file downloaded successful');
  } catch (error: any) {
    console.log('Error downloading video file:', { error });
    await updateRequestStatus(
      requestId,
      StatusType.FAILED,
      `Error Code: DWLD-${error.code ?? 'ENOENT'}`,
    );
    await logger([
      {
        requestId: logRequestId,
        message: 'Error downloading video file',
        error,
        data: {
          videoRequestId: requestId,
        },
      },
    ]);
    return;
  }

  // Process video with FFMPEG based on config
  try {
    // spawnSync('ls', ['/opt'], { stdio: 'inherit' });
    await executeFfmpeg(
      videoFilePath,
      outputFilePath,
      config,
    );
    console.log('Video file processed successful');
  } catch (error: any) {
    console.log('Error processing video file:', { error });
    await updateRequestStatus(
      requestId,
      StatusType.FAILED,
      `Error Code: FMPG-${error.code}`,
    );
    await logger([
      {
        requestId: logRequestId,
        message: 'Error processing video file',
        error,
        data: {
          videoRequestId: requestId,
        },
      },
    ]);
    return;
  }

  // Upload processed video to bucket
  try {
    await uploadToS3(
      `${requestId}/output.${toExt}`,
      outputFilePath,
    );
    console.log('Uploaded processed video to bucket');
  } catch (error: any) {
    console.log('Error uploading processed video file to bucket:', { error });
    await updateRequestStatus(
      requestId,
      StatusType.FAILED,
      `Error Code: UPLD-${error.code}`,
    );
    await logger([
      {
        requestId: logRequestId,
        message: 'Error uploading processed video file to bucket',
        error,
        data: {
          videoRequestId: requestId,
        },
      },
    ]);
    return;
  }

  // Update request status to COMPLETED
  await updateRequestStatus(
    requestId,
    StatusType.COMPLETED,
    `${requestId}/output.${toExt}`,
  );
  console.log('Request status updated to COMPLETED');
  await logger([
    {
      requestId: logRequestId,
      message: 'Successfully processed video',
      data: {
        videoRequestId: requestId,
      },
      duration: differenceInMilliseconds(Date.now(), startTime),
    },
  ]);

  // Delete original video from bucket to save space
  try {
    await deleteFromS3(
      videoFileKey,
    );
    console.log('Deleted original video from bucket');
  } catch (error: any) {
    console.log('Error deleting original video from bucket:', { error });
    await logger([
      {
        requestId: logRequestId,
        message: 'Error deleting original video from bucket',
        error,
        data: {
          videoRequestId: requestId,
        },
      },
    ]);
  }

  console.log('//----- Video Processing End -----//');
};