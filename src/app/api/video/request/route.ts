import { StatusType } from '@/schemas/types';
import { GetVideoRequestResponseType } from '@/schemas/videos-api-schemas';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;

    return NextResponse.json<GetVideoRequestResponseType>({
      status: StatusType.INACTIVE,
    });
    return NextResponse.json<GetVideoRequestResponseType>({
      status: StatusType.COMPLETED,
      fileName: `${params.get('id')}.mp4`,
      downloadLink: '',
    });
    return NextResponse.json<GetVideoRequestResponseType>({
      status: StatusType.FAILED,
      errorMessage: 'Error processing your video. Please try again.'
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
    }, {
      status: 500,
    });
  }
}