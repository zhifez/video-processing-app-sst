import { S3Client } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { SQSClient } from '@aws-sdk/client-sqs';

export const s3 = new S3Client({
  region: 'ap-southeast-1',
});

export const dynamo = new DynamoDBClient({
  region: 'ap-southeast-1',
});

export const sqs = new SQSClient({
  region: 'ap-southeast-1',
});