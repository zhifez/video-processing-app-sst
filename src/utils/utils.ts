import { Readable, Stream } from 'stream';

const fileExtensionPattern = /\.([0-9a-z]+)(?=[?#])|(\.)(?:[\w]+)$/gmi;

export const getFileExtension = (fileName: string) => {
  const matches = fileName.match(fileExtensionPattern);
  if (matches?.length) {
    return matches[0];
  } else {
    return null;
  }
};

export const toEpochTime = (date: Date) =>
  Math.floor(date.getTime() / 1000);

export const streamToBuffer = (stream: Readable): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });