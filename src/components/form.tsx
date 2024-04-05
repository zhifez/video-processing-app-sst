'use client';
import { getFileExtension } from '@/utils/utils';
import { FormEvent, useState } from 'react';

export default function Form({
  videoFileUrl,
  videoConfigUrl,
}: {
  videoFileUrl: string;
  videoConfigUrl: string;
}) {
  const [uploaded, setUploaded] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploaded(false);

    try {
      const videoFile: File = (e.target as HTMLFormElement).file.files?.[0]!;
      await fetch(videoFileUrl, {
        body: videoFile,
        method: 'PUT',
        headers: {
          'Content-Type': videoFile.type,
          'Content-Disposition': `attachment; filename="${videoFile.name}"`,
        },
      });

      const config = {
        fileExt: getFileExtension(videoFile.name),
        // TODO: Include rest of the video editing configs
      };
      const configFile = new Blob([JSON.stringify(config)], {
        type: 'application/json',
      });
      await fetch(videoConfigUrl, {
        body: configFile,
        method: 'PUT',
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