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
    '.Trash',
  ];
  const isProtected = files.some((file) => protectedFiles.includes(file.name));
  const isPrivate = ['projects', 'private'].includes(scheme);
  const isArchive =
    files.length === 1
      ? /^.*\.(t?gz|tar(\.gz)?|zip)$/gi.test(files[0].name)
      : false;
  const isProjectsList =
    scheme === 'projects' &&
    files.some((file) => !file.path.includes('projects'));
  switch (name) {
    case 'rename':
      return (
        !isProtected &&
        files.length === 1 &&
        isPrivate &&
        api !== 'googledrive' &&
        !isProjectsList
      );
    case 'download':
      return (
        files.length === 1 &&
        files[0].format !== 'folder' &&
        api !== 'googledrive' &&
        !isProjectsList
      );
    case 'areMultipleFilesOrFolderSelected':
      return (
        (files.length > 1 || files.some((file) => file.format === 'folder')) &&
        api !== 'googledrive' &&
        !isProjectsList
      );
    case 'extract':
      return (
        files.length === 1 &&
        isArchive &&
        isPrivate &&
        api === 'tapis' &&
        !isProjectsList
      );
    case 'compress':
      return (
        !isArchive &&
        files.length > 0 &&
        isPrivate &&
        api === 'tapis' &&
        !isProjectsList
      );
    case 'copy':
      return files.length > 0 && !isProjectsList;
    case 'move':
      return (
        !isProtected &&
        files.length > 0 &&
        isPrivate &&
        api !== 'googledrive' &&
        !isProjectsList
      );
    case 'trash':
      return (
        !isProtected &&
        !files.some((file) => file.path.startsWith('/.Trash')) &&
        files.length > 0 &&
        isPrivate &&
        api === 'tapis' &&
        !isProjectsList
      );
    case 'public':
      return (
        !isProtected && files.length === 1 && isPrivate && api !== 'googledrive'
      );
    default:
      throw new RangeError('Unknown File Operation');
  }
}
