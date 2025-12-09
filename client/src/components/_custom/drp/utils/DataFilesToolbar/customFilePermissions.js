const customFilePermissions = (operation, files) => {
  const protectedDataTypes = ['sample', 'digital_dataset', 'analysis_data'];

  switch (operation) {
    case 'copy':
    case 'move':
    case 'download':
    case 'extract':
    case 'compress':
    case 'areMultipleFilesOrFolderSelected':
      return files.every((file) => {
        if (!file.metadata) {
          return true;
        }

        return !protectedDataTypes.includes(file.metadata['data_type']);
      });
    default:
      return true;
  }
};

export default customFilePermissions;
