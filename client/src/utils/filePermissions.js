/**
 * Check permissions for a selected file or files
 * @param {String} name
 * @param {Array<Object>} files
 * @param {String} scheme
 * @param {String} api
 * @returns {Boolean}
 */
export default function getFilePermissions(name, { files, scheme, api }) {
  const isPrivate = ['projects', 'private'].includes(scheme);
  switch (name) {
    case 'rename':
      return files.length === 1 && isPrivate && api !== 'googledrive';
    case 'download':
      return (
        files.length === 1 &&
        files[0].format !== 'folder' &&
        api !== 'googledrive'
      );
    case 'extract':
      return (
        files.length === 1 &&
        (files[0].name.includes('.zip') || files[0].name.includes('tar.gz')) &&
        isPrivate &&
        api === 'tapis'
      );
    case 'compress':
    case 'copy':
    case 'move':
    case 'trash':
      return files.length > 0 && isPrivate && api === 'tapis';
    default:
      throw new RangeError('Unknown File Operation');
  }
}
