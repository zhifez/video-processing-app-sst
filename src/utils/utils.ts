const fileExtensionPattern = /\.([0-9a-z]+)(?=[?#])|(\.)(?:[\w]+)$/gmi;

export const getFileExtension = (fileName: string) => {
  const matches = fileName.match(fileExtensionPattern);
  if (matches?.length) {
    return matches[0];
  } else {
    return '';
  }
};