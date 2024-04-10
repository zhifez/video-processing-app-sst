# Video Processing App

An event-driven app that utilises FFMPEG to compress video.

## Architecture

- NextJS App - For user to upload videos and set configs
- UserVideoBucket (S3) - Where the videos will be stored
- VideoRequestQueue (SQS+Lambda) - Subscribe to S3 on object created, send queue
- VideoProcessing (Lambda) - Subscribe to queue, process video using FFMPEG with the given config.json
- DynamoDB (VideoProcessingRequest) - Store request records

## FFMPEG Note

I've yet to figure out how to directly push a layer from sst config, so the FFMPEG layer is manually setup by storing the FFMPEG binary into a S3, assigning it to a layer, before having its arn assigned to a lambda.

The FFMPEG binary is acquired from this site: https://johnvansickle.com/ffmpeg/

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
