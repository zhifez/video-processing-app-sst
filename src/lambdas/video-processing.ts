import { StatusType } from '@/schemas/types';
import { VideoProcessingConfigType } from '@/schemas/videos-api-schemas';
import { dynamo, s3 } from '@/utils/s3-utils';
import { streamToBuffer } from '@/utils/utils';
import { UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { S3Event } from 'aws-lambda';
import { execFile } from 'child_process';
import { createWriteStream, readFileSync } from 'fs';
import { Resource } from 'sst';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

const FFMPEG_PATH = '/opt/bin/ffmpeg-7.0';

const downloadFromS3 = async (Key: string, fileName: string) => {
  const { Body } = await s3.send(new GetObjectCommand({
    Bucket: Resource.UserVideoBucket.name,
    Key,
  }));
  if (Body instanceof Readable) {
    await pipeline(
      Body,
      createWriteStream(`/tmp/${fileName}`)
    );
  } else {
    throw new Error('Expected a stream for Body');
  }
};

const executeFfmpeg = (inputPath: string, outputPath: string) => {
  return new Promise((resolve, reject) => {
    execFile(FFMPEG_PATH, ['-i', inputPath, outputPath], (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }
      resolve({ stdout, stderr });
    });
  });
};

const uploadToS3 = async (Key: string, fileName: string,) => {
  const fileContent = readFileSync(`/tmp/${fileName}`);
  await s3.send(new PutObjectCommand({
    Bucket: Resource.UserVideoBucket.name,
    Key,
    Body: fileContent,
  }));
};

export const handler = async (event: S3Event) => {
  console.log('//----- Video Processing Start -----//');

  // Download and parse config file from bucket
  const recordKey = event.Records[0].s3.object.key;
  let config: VideoProcessingConfigType | null = null;
  try {
    const { Body } = await s3.send(new GetObjectCommand({
      Bucket: Resource.UserVideoBucket.name,
      Key: recordKey,
    }));
    console.log('Config file downloaded successfully:', { config });
    const jsonBuffer = await streamToBuffer(Body as Readable);
    config = JSON.parse(jsonBuffer.toString());
  } catch (error) {
    console.log('Error downloading config file:', { error });
    return;
  }

  if (!config) {
    console.log('Error parsing config file');
    return;
  }

  // Update request status to IN_PROGRESS
  await dynamo.send(new UpdateItemCommand({
    TableName: Resource.VideoRequestTable.name,
    Key: {
      'userId': { S: 'NO_USER' },
      'requestId': { S: config.requestId },
    },
    UpdateExpression: 'set #statusCol = :newStatus',
    ExpressionAttributeNames: {
      '#statusCol': 'status',
    },
    ExpressionAttributeValues: {
      ':newStatus': { S: StatusType.IN_PROGRESS },
    },
  }));
  console.log('Request status updated to IN_PROGRESS');

  // Download video file from bucket
  const videoFileName = `${config.requestId}.${config.fromExt.replace('video/', '')}`;
  const videoFileKey = `${config.requestId}/${videoFileName}`;
  try {
    downloadFromS3(
      videoFileKey,
      videoFileName,
    );
    console.log('Video file downloaded successful');
  } catch (error) {
    console.log('Error downloading video file:', { error });
    return;
  }

  // TODO: Process video with FFMPEG based on config
  console.log('Video processed successful');

  // TODO: Upload processed video to bucket
  console.log('Uploaded processed video to bucket');

  // TODO: Delete original video from bucket to save space
  console.log('Deleted original video from bucket');

  // Update request status to COMPLETED
  await dynamo.send(new UpdateItemCommand({
    TableName: Resource.VideoRequestTable.name,
    Key: {
      'userId': { S: 'NO_USER' },
      'requestId': { S: config.requestId },
    },
    UpdateExpression: 'set #statusCol = :newStatus',
    ExpressionAttributeNames: {
      '#statusCol': 'status',
    },
    ExpressionAttributeValues: {
      ':newStatus': { S: StatusType.COMPLETED },
    },
  }));
  console.log('Request status updated to COMPLETED');

  console.log('//----- Video Processing End -----//');
};