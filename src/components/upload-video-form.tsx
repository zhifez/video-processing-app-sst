'use client';
import { GetVideosUploadResponseSchema, GetVideosUploadResponseType, VideoProcessingConfigType } from '@/schemas/videos-api-schemas';
import { getFileExtension } from '@/utils/utils';
import axios from 'axios';
import { FormEvent, useState } from 'react';

const DEFAULT_FILE_EXTENSION = '.mp4';

export default function UploadVideoForm() {
  const [uploaded, setUploaded] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploaded(false);

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

      await axios.put(
        videoUploadUrl,
        videoFile,
        {
          headers: {
            'Content-Type': videoFile.type,
          },
        },
      );

      const config: VideoProcessingConfigType = {
        fromExt: fileExt,
      };
      const configFile = new Blob([JSON.stringify(config)], {
        type: 'application/json',
      });
      await axios.put(configUploadUrl, {
        body: configFile,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      setUploaded(true);
    } catch (error) {
      console.error({ error });
    }
  };

  return (
    <form
      onSubmit={onSubmit}
    >
      <input name="file" type="file" accept="image/png, image/jpeg" />
      <button type="submit">Upload</button>
      {uploaded && <p>File Uploaded Successfully</p>}
    </form>
  );
}