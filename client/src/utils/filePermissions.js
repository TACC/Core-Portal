/**
 * Check permissions for a selected file or files
 * @param {String} name
 * @param {Array<Object>} files
 * @param {String} scheme
 * @param {String} api
 * @returns {Boolean}
 */
export default function getFilePermissions(
  name,
  { files, scheme, api, customPermissionCheck }
) {
  const protectedFiles = [
    '.bash_profile',
    '.bashrc',
    '.bash_history',
    '.ssh',
    'authorized_keys',
    '.APPDATA',
    '.Trash',
  ];
  const isProtected = files.some((file) => protectedFiles.includes(file.name));
  const isPrivate = ['projects', 'private'].includes(scheme);
  const isArchive =
    files.length === 1
      ? /^.*\.(t?gz|tar(\.gz)?|zip)$/gi.test(files[0].name)
      : false;
  switch (name) {
    case 'rename':
      return (
        !isProtected &&
        files.length === 1 &&
        isPrivate &&
        api !== 'googledrive' &&
        customPermissionCheck(name, files)
      );
    case 'download':
      return (
        files.length === 1 &&
        files[0].format !== 'folder' &&
        api !== 'googledrive' &&
        customPermissionCheck(name, files)
      );
    case 'areMultipleFilesOrFolderSelected':
      return (
        (files.length > 1 || files.some((file) => file.format === 'folder')) &&
        api !== 'googledrive' &&
        customPermissionCheck(name, files)
      );
    case 'extract':
      return (
        files.length === 1 &&
        isArchive &&
        isPrivate &&
        api === 'tapis' &&
        customPermissionCheck(name, files)
      );
    case 'compress':
      return (
        !isArchive &&
        files.length > 0 &&
        isPrivate &&
        api === 'tapis' &&
        customPermissionCheck(name, files)
      );
    case 'copy':
      return files.length > 0 && customPermissionCheck(name, files);
    case 'move':
      return (
        !isProtected &&
        files.length > 0 &&
        isPrivate &&
        api !== 'googledrive' &&
        customPermissionCheck(name, files)
      );
    case 'trash':
      return (
        !isProtected &&
        !files.some((file) => file.path.startsWith('/.Trash')) &&
        files.length > 0 &&
        isPrivate &&
        api === 'tapis'
      );
    case 'public':
      return (
        !isProtected && files.length === 1 && isPrivate && api !== 'googledrive'
      );
    default:
      throw new RangeError('Unknown File Operation');
  }
}
