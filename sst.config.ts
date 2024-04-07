/// <reference path="./.sst/platform/config.d.ts" />
require('dotenv').config();

export default $config({
  app(input) {
    return {
      name: 'video-processing-app',
      removal: input?.stage === 'production' ? 'retain' : 'remove',
      home: 'aws',
      providers: {
        aws: {
          region: 'ap-southeast-1',
        },
      },
    };
  },
  async run() {
    // Secrets
    const secretFfmpegLayerArn = new sst.Secret('FfmpegLayerArn');

    // S3: Store video and json files
    const bucketUserVideo = new sst.aws.Bucket('UserVideoBucket', {
      public: true,
      cors: {
        allowHeaders: ["*"],
        allowOrigins: ["*"],
        allowMethods: ["DELETE", "GET", "HEAD", "POST", "PUT", "HEAD"],
        exposeHeaders: [],
      },
    });

    // DynamoDB: Store video processing requests
    const dynamoVideoRequestTable = new sst.aws.Dynamo('VideoRequestTable', {
      fields: {
        userId: 'string',
        requestId: 'string',
        status: 'string',
        message: 'string',
        updatedAt: 'number',
        ttl: 'number',
      },
      primaryIndex: {
        hashKey: 'userId',
        rangeKey: 'requestId',
      },
      globalIndexes: {
        StatusIndex: {
          hashKey: 'userId',
          rangeKey: 'status',
        },
        UpdatedAtIndex: {
          hashKey: 'userId',
          rangeKey: 'updatedAt',
        },
        TtlIndex: {
          hashKey: 'userId',
          rangeKey: 'ttl',
        },
        MessageIndex: {
          hashKey: 'userId',
          rangeKey: 'message',
        },
      },
    });

    // NextJS: Upload video, download processed output when completed
    new sst.aws.Nextjs('MainSite', {
      link: [
        bucketUserVideo,
        dynamoVideoRequestTable,
      ],
      permissions: [
        {
          actions: [
            'dynamodb:PutItem',
            'dynamodb:Query',
          ],
          resources: [
            `arn:aws:dynamodb:::${dynamoVideoRequestTable.name}/*`,
          ],
        },
      ],
    });
    console.log({ FFMPEG_LAYER: secretFfmpegLayerArn.value as unknown as string });
    // Lambda: Trigger every time something is uploaded to S3
    bucketUserVideo.subscribe({
      handler: 'src/lambdas/video-processing.handler',
      link: [
        bucketUserVideo,
        dynamoVideoRequestTable,
      ],
      permissions: [
        {
          actions: [
            'dynamodb:UpdateItem',
            'dynamodb:Query',
          ],
          resources: [
            `arn:aws:dynamodb:::${dynamoVideoRequestTable.name}/*`,
          ],
        },
      ],
      layers: [
        secretFfmpegLayerArn.value as unknown as string,
      ],
    }, {
      filterSuffix: '.json',
      events: ['s3:ObjectCreated:*'],
    });
  },
});
