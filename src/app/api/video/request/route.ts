import { StatusType } from '@/schemas/types';
import { GetVideoRequestResponseType } from '@/schemas/videos-api-schemas';
import { dynamo, s3, sqs } from '@/utils/s3-utils';
import { QueryCommand } from '@aws-sdk/client-dynamodb';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NextRequest, NextResponse } from 'next/server';
import { Resource } from 'sst';

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const requestId = params.get('id');
    if (!requestId) {
      throw new Error('RequestId not found');
    }

    const retry = params.get('retry');
    if (retry) {
      // Send SQS event with request ID, which will trigger the lambda to redo operation
      await sqs.send(new SendMessageCommand({
        QueueUrl: Resource.VideoRequestQueue.url,
        MessageBody: JSON.stringify({
          requestId,
        }),
      }));
      return NextResponse.json<GetVideoRequestResponseType>({
        status: StatusType.IN_PROGRESS,
      });
    }

    const queryVideoRequestCommand = new QueryCommand({
      TableName: Resource.VideoRequestTable.name,
      KeyConditionExpression: 'userId = :userId AND requestId = :requestId',
      ExpressionAttributeValues: {
        ':userId': {
          S: 'NO_USER',
        },
        ':requestId': {
          S: requestId,
        },
      },
    });

    const response = await dynamo.send(queryVideoRequestCommand);
    if (response.Items?.length) {
      const {
        status: {
          S: requestStatus,
        },
        message: {
          S: requestMessage,
        },
      } = response.Items[0];
      if (!requestStatus) {
        throw new Error('Failed to parse status enum');
      }

      if (requestStatus === StatusType.COMPLETED) {
        // Generate download link
        const downloadLink = await getSignedUrl(
          s3,
          new GetObjectCommand({
            Bucket: Resource.UserVideoBucket.name,
            // Output key is passed as message for COMPLETED state
            Key: requestMessage,
          }),
        );

        return NextResponse.json<GetVideoRequestResponseType>({
          status: requestStatus,
          fileName: `output.mp4`,
          downloadLink,
        });
      }
      if (requestStatus === StatusType.FAILED) {
        return NextResponse.json<GetVideoRequestResponseType>({
          status: requestStatus,
          errorMessage: requestMessage,
        });
      }
      return NextResponse.json<GetVideoRequestResponseType>({
        status: requestStatus as StatusType,
      });
    } else {
      return NextResponse.json<GetVideoRequestResponseType>({
        status: StatusType.FAILED,
        errorMessage: 'Failed to process request'
      }, {
        status: 404,
      });
    }
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
    }, {
      status: 500,
    });
  }
}