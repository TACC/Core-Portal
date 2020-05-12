/**
 * Check permissions for a selected file or files
 * @param {String} name
 * @param {Array<Object>} files
 * @param {String} scheme
 * @returns {Boolean}
 */
export default function getFilePermissions(name, { files, scheme }) {
  switch (name) {
    case 'rename':
      return files.length === 1 && scheme === 'private';
    case 'download':
      return files.length === 1 && files[0].format !== 'folder';
    case 'extract':
      return (
        files.length === 1 &&
        (files[0].name.includes('.zip') || files[0].name.includes('tar.gz')) &&
        scheme === 'private'
      );
    // Move, Copy, Trash, Compress
    default:
      return files.length > 0 && scheme === 'private';
  }
}
