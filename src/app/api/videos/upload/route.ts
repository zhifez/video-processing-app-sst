import { s3 } from '@/utils/s3-utils';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NextRequest, NextResponse } from 'next/server';
import { Resource } from 'sst';

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;

    let ext = params.get('ext');
    if (!ext || !ext.length) {
      throw new Error('Invalid ext input');
    }

    if (ext.includes('.')) {
      ext = `.${ext}`;
    }

    // TODO: Create a record on DynamoDB

    // Generate and return presigned url
    const fileName = crypto.randomUUID();
    const videoUploadCommand = new PutObjectCommand({
      Bucket: Resource.UserVideoBucket.name,
      Key: `${fileName}/${fileName}${ext}`,
    });
    const videoUploadUrl = await getSignedUrl(s3, videoUploadCommand);

    const configUploadCommand = new PutObjectCommand({
      Bucket: Resource.UserVideoBucket.name,
      Key: `${fileName}/${fileName}.json`,
    });
    const configUploadUrl = await getSignedUrl(s3, configUploadCommand);

    return NextResponse.json({
      videoUploadUrl,
      configUploadUrl,
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
    }, {
      status: 500,
    });
  }
}