'use client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { StatusType } from '@/schemas/types';
import { GetVideoRequestResponseSchema, GetVideoRequestResponseType } from '@/schemas/videos-api-schemas';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { BarLoader } from 'react-spinners';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const VideoByIdPage = ({
  params: {
    id,
  },
}: {
  params: {
    id: string;
  },
}) => {
  const router = useRouter();
  const [videoRequest, setVideoRequest] = useState<GetVideoRequestResponseType>({
    status: StatusType.INACTIVE,
  });

  const fetchVideoRequest = async () => {
    try {
      const response = GetVideoRequestResponseSchema.parse(
        (await axios.get(
          '/api/video/request',
          {
            params: {
              id,
            },
          },
        )).data
      );
      setVideoRequest(response);
    } catch (error) {
      console.error('Error fetching video request:', error);
    }
  };

  useEffect(() => {
    const id = setTimeout(fetchVideoRequest, 5000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRetry = () => {
    router.push('/');
  };

  return (
    <Card className="w-1/2">
      <CardHeader>
        <p className="text-xl font-semibold">Video Processing App</p>
        {(videoRequest.status === StatusType.INACTIVE ||
          videoRequest.status === StatusType.IN_PROGRESS) &&
          <p className="text-sm">We are processing your video.</p>}
        {videoRequest.status === StatusType.COMPLETED &&
          <p className="text-sm">Your video is ready to download.</p>}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {(videoRequest.status === StatusType.INACTIVE ||
          videoRequest.status === StatusType.IN_PROGRESS) &&
          <BarLoader
            color="#57B8FF"
            height={8}
            speedMultiplier={1}
            width="100%"
          />}
        {videoRequest.status === StatusType.COMPLETED &&
          <Button asChild>
            <Link href={videoRequest.downloadLink ?? '/'}>
              Download {videoRequest.fileName}
            </Link>
          </Button>}
        {videoRequest.status === StatusType.FAILED &&
          <>
            <Alert variant="destructive">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>
                {videoRequest.errorMessage}
              </AlertDescription>
            </Alert>
            <Button onClick={onRetry}>
              Retry
            </Button>
          </>}
        <Button variant="ghost" asChild>
          <Link href="/">
            Back
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default VideoByIdPage;