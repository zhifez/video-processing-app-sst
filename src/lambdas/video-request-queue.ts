import { sqs } from '@/utils/s3-utils';
import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { S3Event } from 'aws-lambda';
import { Resource } from 'sst';

export const handler = async (event: S3Event) => {
  const key = event.Records[0].s3.object.key;
  const requestId = key.split('/')[0];

  await sqs.send(new SendMessageCommand({
    QueueUrl: Resource.VideoRequestQueue.url,
    MessageBody: JSON.stringify({
      requestId,
    }),
  }));
};