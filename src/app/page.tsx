import { Resource } from "sst";
import Form from "@/components/form";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export default async function Home() {
  const command = new PutObjectCommand({
    Key: crypto.randomUUID(),
    Bucket: Resource.UserVideoBucket.name,
  });
  const url = await getSignedUrl(new S3Client({
    region: 'us-east-1',
  }), command);

  return (
    <main className="p-4">
      <Form url={url} />
    </main>
  );
}