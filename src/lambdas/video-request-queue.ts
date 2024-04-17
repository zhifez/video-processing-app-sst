import { sqs } from '@/app/api/utils';
import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { S3Event } from 'aws-lambda';
import { Resource } from 'sst';
import { baselimeLogger } from './utils';

const LOG_NAMESPACE = 'video-request-queue';

const logger = baselimeLogger(LOG_NAMESPACE);

export const handler = async (event: S3Event) => {
  const key = event.Records[0].s3.object.key;
  const videoRequestId = key.split('/')[0];
  const logRequestId = crypto.randomUUID();

  try {
    await sqs.send(new SendMessageCommand({
      QueueUrl: Resource.VideoRequestQueue.url,
      MessageBody: JSON.stringify({
        requestId: videoRequestId
      }),
    }));
    await logger([
      {
        requestId: logRequestId,
        message: 'Successfully sent queue',
        data: {
          videoRequestId,
        },
      },
    ]);
  } catch (error: any) {
    await logger([
      {
        requestId: logRequestId,
        message: 'Failed to send queue',
        error: error.message,
      },
    ]);
  }
};