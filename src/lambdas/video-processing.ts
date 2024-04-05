import { GetObjectCommand, S3, S3Client } from '@aws-sdk/client-s3';
import { S3Event } from 'aws-lambda';
import { Resource } from 'sst';

const s3 = new S3Client({
  region: 'ap-southeast-1',
});

export const handler = async (event: S3Event) => {
  console.log('//----- Video Processing Start -----//');

  console.log('Download video and config files from bucket');
  for (const record of event.Records) {
    console.log({ obj: record.s3.object, });
    // try {
    //   const command = new GetObjectCommand({
    //     Key: record.s3.object.key,
    //     Bucket: Resource.UserVideoBucket.name,
    //   });
    //   const data = await s3.send(command);
    //   console.log('Data downloaded successfully:', { data });
    // } catch (error) {
    //   console.log('Error getting object from S3:', { error });
    // }
  }

  console.log('Parse config file to json');
  console.log('Create record in VideoProcessingRequestTable');
  console.log('Process video with FFMPEG based on config');
  console.log('Process video successful');
  console.log('Upload processed video to bucket');
  console.log('Update record in VideoProcessingRequestTable');
  console.log('//----- Video Processing End -----//');
};