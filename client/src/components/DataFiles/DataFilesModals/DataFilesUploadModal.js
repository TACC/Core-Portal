import React, { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import uuidv4 from 'uuid/v4';
import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Table
} from 'reactstrap';
import { FileLengthCell } from '../DataFilesListing/DataFilesListingCells';

const DataFilesUploadStatus = ({ i, removeCallback }) => {
  const status = useSelector(state => state.files.operationStatus.upload[i]);
  switch (status) {
    case 'UPLOADING':
      return <span>UPLOADING</span>;
    case 'SUCCESS':
      return <span>SUCCESS</span>;
    case 'ERROR':
      return <span>ERROR</span>;
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

  const uploadRef = useRef({ files: [] });
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

  const selectFiles = () => {
    const files = [];
    for (let i = 0; i < uploadRef.current.files.length; i += 1) {
      files.push({ data: uploadRef.current.files.item(i), id: uuidv4() });
    }

    setUploadedFiles([...uploadedFiles, ...files]);
    uploadRef.current.value = null;
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} onClosed={onClosed} size="lg">
      <ModalHeader toggle={toggle}>Upload Files</ModalHeader>
      <ModalBody>
        <input
          ref={uploadRef}
          hidden
          type="file"
          multiple
          onChange={selectFiles}
        />
        <div>
          <Button onClick={() => uploadRef.current.click()}>
            Select File(s)
          </Button>
        </div>
        <div>Uploading to {params.path || 'My Data/'}</div>
        <div className="row">
          <Table striped hidden={uploadedFiles.length === 0}>
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
                  <td style={{ verticalAlign: 'middle' }}>{file.data.name}</td>
                  <td style={{ verticalAlign: 'middle' }}>
                    <FileLengthCell cell={{ value: file.data.size }} />
                  </td>
                  <td>
                    <DataFilesUploadStatus
                      i={file.id}
                      removeCallback={removeFile}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button className="data-files-btn" onClick={uploadStart}>
          Upload
        </Button>{' '}
        <Button
          color="secondary"
          className="data-files-btn-cancel"
          onClick={toggle}
        >
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default DataFilesUploadModal;
