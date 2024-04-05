"use client";
import { FormEvent, useState } from 'react';

export default function Form({ url }: { url: string; }) {
  const [uploaded, setUploaded] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploaded(false);

    try {
      const file = (e.target as HTMLFormElement).file.files?.[0]!;
      await fetch(url, {
        body: file,
        method: "PUT",
        headers: {
          "Content-Type": file.type,
          "Content-Disposition": `attachment; filename="${file.name}"`,
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