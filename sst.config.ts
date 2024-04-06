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

    new sst.aws.Nextjs('MainSite', {
      link: [
        bucketUserVideo,
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
