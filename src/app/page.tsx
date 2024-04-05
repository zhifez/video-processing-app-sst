import { Resource } from "sst";
import Form from "@/components/form";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from '@/utils/s3-utils';

export default async function Home() {
  const fileName = crypto.randomUUID();
  const videoFileUploadCommand = new PutObjectCommand({
    Bucket: Resource.UserVideoBucket.name,
    Key: `${fileName}/${fileName}`,
  });
  const videoFileUrl = await getSignedUrl(s3, videoFileUploadCommand);

  const videoConfigUploadCommand = new PutObjectCommand({
    Bucket: Resource.UserVideoBucket.name,
    Key: `${fileName}/${fileName}.json`,
  });
  const videoConfigUrl = await getSignedUrl(s3, videoConfigUploadCommand);

  return (
    <main className="p-4">
      <Form
        videoFileUrl={videoFileUrl}
        videoConfigUrl={videoConfigUrl}
      />
    </main>
  );
}