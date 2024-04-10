import { ScaleMetric } from '@/schemas/types';
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

export const getFfmpegScaleAlgo = (scale: ScaleMetric) => {
  switch (scale) {
    case ScaleMetric.Half:
      return 'scale=trunc(iw/4)*2:trunc(ih/4)*2';
    case ScaleMetric.OneThird:
      return 'scale=trunc(iw/6)*2:trunc(ih/6)*2';
    case ScaleMetric.Quarter:
      return 'scale=trunc(iw/8)*2:trunc(ih/8)*2';
    case ScaleMetric.OneFifth:
      return 'scale=trunc(iw/10)*2:trunc(ih/10)*2';
  }
  return '';
};