import { useEffect } from 'react';

const DataFilesUploadModalAddon = ({ uploadedFiles, setUploadedFiles }) => {
  useEffect(() => {
    if (uploadedFiles.length && !uploadedFiles.every((file) => file.metadata)) {
      setUploadedFiles(
        uploadedFiles.map((file) =>
          file.metadata ? file : { ...file, metadata: { data_type: 'file' } }
        )
      );
    }
  }, [uploadedFiles, setUploadedFiles]);

  return null;
};

export default DataFilesUploadModalAddon;
