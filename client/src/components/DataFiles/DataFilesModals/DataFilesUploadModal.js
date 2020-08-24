import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid';
import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Table
} from 'reactstrap';
import { LoadingSpinner, FileInputDropZone } from '_common';
import { findSystemDisplayName } from 'utils/systems';
import { FileLengthCell } from '../DataFilesListing/DataFilesListingCells';

const DataFilesUploadStatus = ({ i, removeCallback }) => {
  const status = useSelector(state => state.files.operationStatus.upload[i]);
  switch (status) {
    case 'UPLOADING':
      return <LoadingSpinner placement="inline" />;
    case 'SUCCESS':
      return <span className="badge badge-success">SUCCESS</span>;
    case 'ERROR':
      return <span className="badge badge-danger">ERROR</span>;
    default:
      return (
        <button
          type="button"
          className="btn btn-link"
          onClick={() => removeCallback(i)}
        >
          Remove
        </button>
      );
  }
};
DataFilesUploadStatus.propTypes = {
  i: PropTypes.string.isRequired,
  removeCallback: PropTypes.func.isRequired
};

const DataFilesUploadModal = () => {
  const history = useHistory();
  const location = useLocation();
  const reloadCallback = () => {
    history.push(location.pathname);
  };

  const isOpen = useSelector(state => state.files.modals.upload);
  const params = useSelector(state => state.files.params.FilesListing);
  const status = useSelector(state => state.files.operationStatus.upload);
  const systemList = useSelector(state => state.systems.systemList);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const dispatch = useDispatch();
  const uploadStart = () => {
    const filteredFiles = uploadedFiles.filter(f => status[f.id] !== 'SUCCESS');
    filteredFiles.length > 0 &&
      dispatch({
        type: 'DATA_FILES_UPLOAD',
        payload: {
          system: params.system,
          path: params.path || '',
          files: filteredFiles,
          reloadCallback
        }
      });
  };

  const systemDisplayName = findSystemDisplayName(systemList, params.system);

  const removeFile = id => {
    setUploadedFiles(uploadedFiles.filter(f => f.id !== id));
  };

  const onClosed = () => {
    setUploadedFiles([]);
    dispatch({ type: 'DATA_FILES_MODAL_CLOSE' });
    dispatch({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { operation: 'upload', status: {} }
    });
  };

  const toggle = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'upload', props: {} }
    });
  };

  const selectFiles = acceptedFiles => {
    const newFiles = [];
    acceptedFiles.forEach(file => {
      newFiles.push({ data: file, id: uuidv4() });
    });
    setUploadedFiles(files => [...files, ...newFiles]);
  };

  const onRejectedFiles = rejectedFiles => {
    const newFiles = [];
    rejectedFiles.forEach(file => {
      newFiles.push({ data: file, id: uuidv4() });
    });
    setUploadedFiles(files => [...files, ...newFiles]);
  };

  return (
    <Modal
      isOpen={isOpen}
      toggle={toggle}
      onClosed={onClosed}
      size="xl"
      className="dataFilesModal"
    >
      <ModalHeader toggle={toggle}>Upload Files</ModalHeader>
      <ModalBody>
        <FileInputDropZone
          onSetFiles={selectFiles}
          onRejectedFiles={onRejectedFiles}
          maxSize={524288000}
          maxSizeMessage="Max File Size: 500MB"
        />

        <div hidden={uploadedFiles.length === 0} style={{ marginTop: '10px' }}>
          <span style={{ fontSize: '20px' }}>
            Uploading to {systemDisplayName}/{params.path}
          </span>

          <div>
            <div
              style={{
                border: '1px solid black',
                width: '100%',
                marginTop: '5px',
                height: '300px',
                overflow: 'auto'
              }}
            >
              <Table striped>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Size</th>
                    <th aria-label="null" />
                  </tr>
                </thead>
                <tbody>
                  {uploadedFiles.map((file, i) => (
                    <tr key={file.id}>
                      <td style={{ verticalAlign: 'middle' }}>
                        {file.data.name}
                      </td>
                      <td style={{ verticalAlign: 'middle' }}>
                        <FileLengthCell cell={{ value: file.data.size }} />
                      </td>
                      <td>
                        <span className="float-right">
                          <DataFilesUploadStatus
                            i={file.id}
                            removeCallback={removeFile}
                          />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button className="data-files-btn" onClick={uploadStart}>
          Upload Selected
        </Button>{' '}
        <Button
          color="secondary"
          className="data-files-btn-cancel"
          onClick={toggle}
        >
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default DataFilesUploadModal;
