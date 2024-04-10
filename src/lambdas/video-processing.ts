import { StatusType } from '@/schemas/types';
import { VideoProcessingConfigType } from '@/schemas/videos-api-schemas';
import { dynamo, s3 } from '@/utils/s3-utils';
import { streamToBuffer } from '@/utils/utils';
import { UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { S3Event } from 'aws-lambda';
import { execFile, spawnSync } from 'child_process';
import { createWriteStream, readFileSync } from 'fs';
import { Resource } from 'sst';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

const FFMPEG_PATH = '/opt/ffmpeg/ffmpeg';

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

const executeFfmpeg = (inputFilePath: string, outputFilePath: string) => {
  return new Promise((resolve, reject) => {
    execFile(
      FFMPEG_PATH,
      [
        '-i',
        inputFilePath,
        outputFilePath,
      ],
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

export const handler = async (event: S3Event) => {
  console.log('//----- Video Processing Start -----//');

  // Download and parse config file from bucket
  const recordKey = event.Records[0].s3.object.key;
  const requestId = recordKey.split('/')[0];
  let config: VideoProcessingConfigType | null = null;
  try {
    const { Body } = await s3.send(new GetObjectCommand({
      Bucket: Resource.UserVideoBucket.name,
      Key: recordKey,
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
  const fromExt = config.fromExt.replace('video/', '');
  const toExt = config.toExt?.replace('video/', '') ?? fromExt;
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
      `Error Code: DWLD-${error.code}`,
    );
    return;
  }

  // Process video with FFMPEG based on config
  try {
    // spawnSync('ls', ['/opt'], { stdio: 'inherit' });
    await executeFfmpeg(
      videoFilePath,
      outputFilePath,
    );
    console.log('Video file processed successful');
  } catch (error: any) {
    console.log('Error processing video file:', { error });
    await updateRequestStatus(
      requestId,
      StatusType.FAILED,
      `Error Code: FMPG-${error.code}`,
    );
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
    return;
  }

  // Delete original video from bucket to save space
  try {
    await deleteFromS3(
      videoFileKey,
    );
    console.log('Deleted original video from bucket');
  } catch (error: any) {
    console.log('Error deleting original video from bucket:', { error });
  }

  // Update request status to COMPLETED
  await updateRequestStatus(
    requestId,
    StatusType.COMPLETED,
    `${requestId}/output.${toExt}`,
  );
  console.log('Request status updated to COMPLETED');

  console.log('//----- Video Processing End -----//');
};