'use client';
import { GetVideosUploadResponseSchema, GetVideosUploadResponseType, VideoProcessingConfigType } from '@/schemas/videos-api-schemas';
import { getFileExtension, VideoFileType } from '@/utils/utils';
import axios from 'axios';
import { ChangeEvent, FormEvent, useState } from 'react';
import { VideoOutputSelector } from './video-output-selector';

const INPUT_ACCEPTED_FORMATS = 'video/*';
const INPUT_MAX_FILE_SIZE = 1024 * 1024 * 5; // 5MB
const DEFAULT_FILE_EXTENSION = '.mp4';

export default function UploadVideoForm() {
  const [loading, setLoading] = useState<boolean>(false);
  const [file, setFile] = useState<File | undefined>();
  const [outputType, setOutputType] = useState<VideoFileType>(VideoFileType.MP4);
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<boolean>(false);

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
    setSuccess(false);

    try {
      const videoFile: File = (e.target as HTMLFormElement).file.files?.[0]!;
      const fileExt = getFileExtension(videoFile.name) ?? DEFAULT_FILE_EXTENSION;

      const {
        data: {
          videoUploadUrl,
          configUploadUrl,
        },
      } =
        GetVideosUploadResponseSchema.parse(
          await axios.get<GetVideosUploadResponseType>(
            '/api/videos/upload',
            {
              params: {
                ext: fileExt,
              },
            }
          )
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

      setSuccess(true);
    } catch (error: any) {
      setError(error.message);
    }

    setLoading(false);
  };

  const canUpload = (
    !loading && file && file.type !== outputType
  );

  return (
    <form
      className="w-1/3 flex flex-col gap-3 text-center"
      onSubmit={onSubmit}
    >
      <input
        name="file"
        type="file"
        accept={INPUT_ACCEPTED_FORMATS}
        onChange={onSelectFile}
        placeholder="Upload a video file (max 5MB)"
        className="block w-full"
      />
      {file && <VideoOutputSelector
        activeType={outputType}
        onSelect={setOutputType}
      />}
      <button
        type="submit"
        className={`rounded p-2 font-semibold text-white 
        bg-blue-500 ${!canUpload ? 'opacity-80' : 'hover:bg-blue-400 active:bg-blue-500 '}`}
        disabled={!canUpload}
      >
        Convert
      </button>
      {error && <p className="text-red-500">{error}</p>}
      {success && <p className="text-blue-500">File Uploaded Successfully</p>}
    </form>
  );
}