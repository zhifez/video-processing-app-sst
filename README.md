# Video Processing App

An event-driven app that utilises FFMPEG to process video.

![Screenshot 2024-04-11 at 10 11 12 AM](https://github.com/zhifez/video-processing-app-sst/assets/33366655/5c06c798-4eeb-45ed-b1c7-4abdda685274)


## System Design

- NextJS App - For user to upload videos and set configs
- UserVideoBucket (S3) - Where the videos will be stored
- VideoRequestQueue (SQS+Lambda) - Subscribe to S3 on object created, send queue
- VideoProcessing (Lambda) - Subscribe to queue, process video using FFMPEG with the given config.json
- DynamoDB (VideoProcessingRequest) - Store request records

## Getting Started

Before you get started:

1. [Configure your AWS credentials](https://docs.sst.dev/advanced/iam-credentials#loading-from-a-file)
2. [Install the SST CLI](https://ion.sst.dev/docs/reference/cli)

To test locally, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

To deploy, run:

```bash
sst deploy
```

## FFMPEG

### Binary Upload

I have yet to figure out how to directly push a layer from sst config, so the FFMPEG layer is manually setup as followed:
1. Download FFMPEG binary (from [here](https://johnvansickle.com/ffmpeg/)), uncompress it, rename it to "ffmpeg" and ZIP it.
2. Upload it to S3
3. Go to Lambda layers, create a new layer and pass in the URL.
4. Copy the ARN of the layer, and save it in Secret with the key "FfmpegLayerArn":
```bash
sst secret set FfmpegLayerArn <your-layer-arn>
```

### Timeout

FFMPEG operation can be quite heavy and timeout a lot:

```
Task timed out after 300.10 seconds
```

When that happens, increase the timeout (max 15 minutes).

```
queueVideoRequest.subscribe({
  handler: 'src/lambdas/video-processing.handler',
  ...
  // FFMPEG might take some time to work depending on video size and complexity of command
  timeout: '5 minutes', // '15 minutes' (max)
  ...
});
```

## Baselime Integration

Baselime API is integrated to trace the following:
- Queue sent
- Video processing completed/failed (with duration)

![Screenshot 2024-04-17 at 11 49 11 PM](https://github.com/zhifez/video-processing-app-sst/assets/33366655/e7afa051-3807-4986-bc93-fd675a6dc99f)

### Setup Steps
1. Store your API Key using SST secret with:
```bash
sst secret set BaselimeApiKey <your-api-key>
```

2. Deploy to see the changes with:
```bash
sst deploy
```
