import React from 'react';
import PropTypes from 'prop-types';
import { Table } from 'reactstrap';
import { LoadingSpinner, InlineMessage, Button } from '_common';
import { FileLengthCell } from '../../DataFilesListing/DataFilesListingCells';
import { useUpload } from 'hooks/datafiles/mutations';
import styles from './DataFilesUploadModalListingTable.module.scss';
import { useSelector } from 'react-redux';
import { useAddonComponents, useFileListing } from 'hooks/datafiles';

const DataFilesUploadStatus = ({ i, removeCallback, rejectedFiles }) => {
  if (rejectedFiles.filter((f) => f.id === i).length > 0) {
    return <InlineMessage type="error">Exceeds File Size Limit</InlineMessage>;
  }
  const errorMessage = useSelector((state) => state.files.error.message);
  const status = useUpload().status[i];
  switch (status) {
    case 'UPLOADING':
      return <LoadingSpinner placement="inline" />;
    case 'SUCCESS':
      return <span className="badge badge-success">SUCCESS</span>;
    case 'ERROR':
      return (
        <InlineMessage type="error">
          Upload Failed: {errorMessage}
        </InlineMessage>
      );
    default:
      return (
        <Button type="link" onClick={() => removeCallback(i)}>
          Remove
        </Button>
      );
  }
};
DataFilesUploadStatus.propTypes = {
  i: PropTypes.string.isRequired,
  removeCallback: PropTypes.func.isRequired,
  rejectedFiles: PropTypes.arrayOf(PropTypes.object).isRequired,
};

function DataFilesUploadModalListingTable({
  uploadedFiles,
  rejectedFiles,
  setUploadedFiles,
}) {
  const removeFile = (id) => {
    setUploadedFiles(uploadedFiles.filter((f) => f.id !== id));
  };

  const { params } = useFileListing('FilesListing');
  const portalName = useSelector((state) => state.workbench.portalName);
  const { DataFilesUploadModalListingTableAddon } = useAddonComponents({ portalName });

  return (
    <div className={styles['table-wrapper']}>
      <Table striped>
        <thead>
          <tr>
            <th>Name</th>
            <th>Size</th>
            <th aria-label="null" />
            <th aria-label="null" />
          </tr>
        </thead>
        <tbody>
          {uploadedFiles.map((file, i) => (
            <tr key={file.id}>
              <td style={{ verticalAlign: 'middle' }}>{file.data.name}</td>
              <td style={{ verticalAlign: 'middle' }}>
                <FileLengthCell cell={{ value: file.data.size }} />
              </td>
              <td>
                {DataFilesUploadModalListingTableAddon && params.scheme === 'projects' && (
                  <DataFilesUploadModalListingTableAddon
                    file={file}
                    onToggleAdvancedImageFile={(fileId, value) =>
                      setUploadedFiles((prevFiles) =>
                        prevFiles.map((f) =>
                          f.id === fileId
                            ? { ...f, is_advanced_image_file: value }
                            : f
                        )
                      )
                    }
                  />
                )}
              </td>
              <td>
                <span className="float-right">
                  <DataFilesUploadStatus
                    i={file.id}
                    removeCallback={removeFile}
                    rejectedFiles={rejectedFiles}
                  />
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

DataFilesUploadModalListingTable.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  uploadedFiles: PropTypes.arrayOf(PropTypes.object).isRequired,
  rejectedFiles: PropTypes.arrayOf(PropTypes.object).isRequired,
  setUploadedFiles: PropTypes.func.isRequired,
};

export default DataFilesUploadModalListingTable;
