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

export enum VideoFileType {
  MP4 = 'video/mp4',          // MP4
  WEBM = 'video/webm',        // WebM
  AVI = 'video/avi',          // AVI
  MOV = 'video/quicktime',    // MOV
  WMV = 'video/x-ms-wmv',     // WMV
  FLV = 'video/x-flv',        // FLV
  MKV = 'video/x-matroska',   // MKV
  OGV = 'video/ogg',          // OGV
  v3GP = 'video/3gpp',        // 3GP
  MPG = 'video/mpeg',         // MPEG, MPG
  M4V = 'video/x-m4v',        // M4V
  v3G2 = 'video/3gpp2',       // 3G2
  H264 = 'video/h264',        // H.264
  H265 = 'video/h265',        // H.265
};