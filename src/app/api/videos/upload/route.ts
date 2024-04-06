import { StatusType } from '@/schemas/types';
import { dynamo, s3 } from '@/utils/s3-utils';
import { PutItemCommand } from '@aws-sdk/client-dynamodb';
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

    if (!ext.includes('.')) {
      ext = `.${ext}`;
    }

    // Create a record on DynamoDB
    const requestId = crypto.randomUUID();
    const createVideoRequestCommand = new PutItemCommand({
      TableName: Resource.VideoRequestTable.name,
      Item: {
        'requestId': {
          S: requestId,
        },
        'status': {
          S: StatusType.IN_PROGRESS,
        },
        'updatedAt': {
          S: new Date().toISOString(),
        },
      },
    });

    // Generate and return presigned url
    const videoUploadCommand = new PutObjectCommand({
      Bucket: Resource.UserVideoBucket.name,
      Key: `${requestId}/${requestId}${ext}`,
    });
    const configUploadCommand = new PutObjectCommand({
      Bucket: Resource.UserVideoBucket.name,
      Key: `${requestId}/${requestId}.json`,
    });

    const [_, videoUploadUrl, configUploadUrl] = await Promise.all([
      dynamo.send(createVideoRequestCommand),
      getSignedUrl(s3, videoUploadCommand),
      getSignedUrl(s3, configUploadCommand),
    ]);

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