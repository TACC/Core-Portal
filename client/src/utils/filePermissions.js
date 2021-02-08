/**
 * Check permissions for a selected file or files
 * @param {String} name
 * @param {Array<Object>} files
 * @param {String} scheme
 * @param {String} api
 * @returns {Boolean}
 */
export default function getFilePermissions(name, { files, scheme, api }) {
  const protectedFiles = [
    '.bash_profile',
    '.bashrc',
    '.bash_history',
    '.ssh',
    'authorized_keys',
    '.APPDATA',
    '.Trash'
  ];
  const isProtected = files.some(file => protectedFiles.includes(file.name));

  const isPrivate = ['projects', 'private'].includes(scheme);
  const isArchive =
    files.length === 1
      ? files[0].name.endsWith('.zip') || files[0].name.endsWith('.tar.gz')
      : false;
  switch (name) {
    case 'rename':
      return (
        !isProtected && files.length === 1 && isPrivate && api !== 'googledrive'
      );
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
      return files.length > 0 && isPrivate;
    case 'move':
      return (
        !isProtected && files.length > 0 && isPrivate && api !== 'googledrive'
      );
    case 'trash':
      return !isProtected && files.length > 0 && isPrivate && api === 'tapis';
    case 'public':
      return (
        !isProtected && files.length === 1 && isPrivate && api !== 'googledrive'
      );
    default:
      throw new RangeError('Unknown File Operation');
  }
}
