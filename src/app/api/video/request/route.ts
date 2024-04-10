import { StatusType } from '@/schemas/types';
import { GetVideoRequestResponseType } from '@/schemas/videos-api-schemas';
import { dynamo } from '@/utils/s3-utils';
import { QueryCommand } from '@aws-sdk/client-dynamodb';
import { NextRequest, NextResponse } from 'next/server';
import { Resource } from 'sst';

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const requestId = params.get('id');
    if (!requestId) {
      throw new Error('RequestId not found');
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
        // TODO: Generate download link
        return NextResponse.json<GetVideoRequestResponseType>({
          status: requestStatus,
          fileName: `${params.get('id')}.mp4`,
          downloadLink: '',
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
        errorMessage: 'Unable to find request'
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