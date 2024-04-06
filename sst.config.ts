/// <reference path="./.sst/platform/config.d.ts" />

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
    const bucketUserVideo = new sst.aws.Bucket('UserVideoBucket', {
      public: true,
      cors: {
        allowHeaders: ["*"],
        allowOrigins: ["*"],
        allowMethods: ["DELETE", "GET", "HEAD", "POST", "PUT", "HEAD"],
        exposeHeaders: [],
      },
    });

    const dynamoVideoRequestTable = new sst.aws.Dynamo('VideoRequestTable', {
      fields: {
        userId: 'string',
        requestId: 'string',
        status: 'string',
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
      },
    });

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

    // Trigger Lambda every time something is uploaded
    bucketUserVideo.subscribe({
      handler: 'src/lambdas/video-processing.handler',
      link: [bucketUserVideo],
    }, {
      filterSuffix: '.json',
      events: ['s3:ObjectCreated:*'],
    });
  },
});
