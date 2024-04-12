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
    // Secrets
    const secretFfmpegLayerArn = new sst.Secret('FfmpegLayerArn');

    // S3: Store video and json files
    const bucketUserVideo = new sst.aws.Bucket('UserVideoBucket', {
      public: true,
    });

    // Queues
    const queueVideoRequest = new sst.aws.Queue('VideoRequestQueue');

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
        queueVideoRequest,
      ],
    });

    // Lambda: Trigger and send queue when a json file is uploaded to S3
    bucketUserVideo.subscribe({
      handler: 'src/lambdas/video-request-queue.handler',
      link: [
        queueVideoRequest,
      ],
    }, {
      filterSuffix: '.json',
      events: ['s3:ObjectCreated:*'],
    });

    // Lambda: Trigger and process video when a queue is sent
    queueVideoRequest.subscribe({
      handler: 'src/lambdas/video-processing.handler',
      link: [
        bucketUserVideo,
        dynamoVideoRequestTable,
      ],
      // FFMPEG might take some time to work depending on video size and complexity of command
      timeout: '5 minutes',
      layers: [
        secretFfmpegLayerArn.value as unknown as string,
      ],
    });
  },
});
