'use client';
import { GetVideosUploadResponseSchema, GetVideosUploadResponseType, VideoProcessingConfigType } from '@/schemas/videos-api-schemas';
import { getFileExtension, VideoFileType } from '@/utils/utils';
import axios from 'axios';
import { ChangeEvent, FormEvent, useState } from 'react';
import { VideoOutputSelector } from './video-output-selector';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader } from './ui/card';
import { redirect, useRouter } from 'next/navigation';

const INPUT_ACCEPTED_FORMATS = 'video/*';
const INPUT_MAX_FILE_SIZE = 1024 * 1024 * 5; // 5MB
const DEFAULT_FILE_EXTENSION = '.mp4';

export default function UploadVideoForm() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [file, setFile] = useState<File | undefined>();
  const [outputType, setOutputType] = useState<VideoFileType>(VideoFileType.MP4);
  const [error, setError] = useState<string | undefined>();

  const onSelectFile = (e: ChangeEvent<HTMLInputElement>) => {
    const videoFile: File = (e.target as HTMLInputElement).files?.[0]!;
    if (videoFile.size > INPUT_MAX_FILE_SIZE) {
      setError('File size should not exceed 5MB');
      setFile(undefined);
    } else {
      setError(undefined);
      setFile(videoFile);
    }
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(undefined);

    try {
      const videoFile: File = (e.target as HTMLFormElement).file.files?.[0]!;
      const fileExt = getFileExtension(videoFile.name) ?? DEFAULT_FILE_EXTENSION;

      const {
        requestId,
        videoUploadUrl,
        configUploadUrl,
      } =
        GetVideosUploadResponseSchema.parse(
          (await axios.get(
            '/api/video/upload',
            {
              params: {
                ext: fileExt,
              },
            }
          )).data
        );

      // Upload video
      await axios.put(
        videoUploadUrl,
        videoFile,
        {
          headers: {
            'Content-Type': videoFile.type,
          },
        },
      );

      // Upload config file
      const config: VideoProcessingConfigType = {
        requestId,
        fromExt: videoFile.type,
        toExt: outputType.toString(),
      };
      const configFile = new Blob([JSON.stringify(config)], {
        type: 'application/json',
      });
      await axios.put(
        configUploadUrl,
        configFile,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      router.push(`/request/${requestId}`);
    } catch (error: any) {
      setError(error.message);
    }

    setLoading(false);
  };

  const canUpload = (
    !loading && file && file.type !== outputType
  );

  return (
    <Card className="w-1/2">
      <CardHeader>
        <p className="text-xl font-semibold">Video Processing App</p>
        <ul className="text-sm list-disc list-inside">
          <li>Convert video to a different format</li>
          <li>Reduce file size</li>
        </ul>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-3"
          onSubmit={onSubmit}
        >
          <Label>Upload a video file (max 5MB)</Label>
          <Input
            name="file"
            type="file"
            accept={INPUT_ACCEPTED_FORMATS}
            onChange={onSelectFile}
            className="block w-full"
          />
          {file && <VideoOutputSelector
            activeType={outputType}
            onSelect={setOutputType}
          />}
          <Button
            type="submit"
            disabled={!canUpload}
          >
            Convert
          </Button>
          {error && <p className="text-sm font-semibold text-center text-red-500">{error}</p>}
        </form>
      </CardContent>
    </Card>
  );
}