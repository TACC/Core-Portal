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
  const isArchive = files[0]
    ? files[0].name.endsWith('.zip') || files[0].name.endsWith('.tar.gz')
    : false;
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
      return files.length === 1 && isArchive && isPrivate && api === 'tapis';
    case 'compress':
      return !isArchive && files.length > 0 && isPrivate && api === 'tapis';
    case 'copy':
    case 'move':
    case 'trash':
      return files.length > 0 && isPrivate && api === 'tapis';
    default:
      throw new RangeError('Unknown File Operation');
  }
}
