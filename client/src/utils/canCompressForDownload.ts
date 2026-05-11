import { TTapisFile } from './types';

export default function canCompressForDownload(
  selectedFiles: Array<TTapisFile>
) {
  let containsFolder = false;
  let exceedsSizeLimit = false;
  let totalFileSize = 0;
  const maxFileSize = 2 * 1024 * 1024 * 1024;

  // Add up the file sizes of all files and shows if the user selected a folder
  selectedFiles.forEach((selectedFile) => {
    if (selectedFile.format == 'folder') {
      containsFolder = true;
      return { exceedsSizeLimit, containsFolder };
    }
    totalFileSize = totalFileSize + selectedFile.length;
  });

  if (totalFileSize > maxFileSize) {
    exceedsSizeLimit = true;
  }

  return { exceedsSizeLimit, containsFolder };
}
