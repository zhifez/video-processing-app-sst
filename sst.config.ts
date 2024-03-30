/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "video-processing-app",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
    };
  },
  async run() {
    const bucket = new sst.aws.Bucket('UserVideoBucket', {
      public: true,
    });

    new sst.aws.Nextjs('MainSite', {
      link: [bucket],
    });
  },
});
