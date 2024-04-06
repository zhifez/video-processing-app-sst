import { S3Client } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';


export const s3 = new S3Client({
  region: 'ap-southeast-1',
});

export const dynamo = new DynamoDBClient({
  region: 'ap-southeast-1',
});