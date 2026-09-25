import { useEffect } from 'react';

// Default upload-modal addon: tags each uploaded file with a `file` data_type
// so it participates in the project metadata graph.
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
