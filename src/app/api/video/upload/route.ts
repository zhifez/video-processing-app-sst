import { StatusType } from '@/schemas/types';
import { GetVideosUploadResponseType } from '@/schemas/videos-api-schemas';
import { dynamo, s3 } from '@/utils/s3-utils';
import { toEpochTime } from '@/utils/utils';
import { PutItemCommand } from '@aws-sdk/client-dynamodb';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NextRequest, NextResponse } from 'next/server';
import { Resource } from 'sst';
import { addDays } from 'date-fns';

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
        'userId': {
          S: 'NO_USER',
        },
        'requestId': {
          S: requestId,
        },
        'status': {
          S: StatusType.INACTIVE,
        },
        'updatedAt': {
          N: toEpochTime(new Date()).toString(),
        },
        'ttl': {
          N: toEpochTime(addDays(new Date(), 1)).toString(),
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

    return NextResponse.json<GetVideosUploadResponseType>({
      requestId,
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