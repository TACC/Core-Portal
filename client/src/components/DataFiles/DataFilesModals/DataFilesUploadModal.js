import React, { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
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
  i: PropTypes.number.isRequired,
  removeCallback: PropTypes.func.isRequired
};

const DataFilesUploadModal = () => {
  const history = useHistory();
  const location = useLocation();
  const reloadCallback = () => {
    history.push(location.pathname);
  };

  const isOpen = useSelector(state => state.files.modals.upload);

  const uploadRef = useRef({ files: [] });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const params = useSelector(state => state.files.params.FilesListing);
  const dispatch = useDispatch();
  const uploadStart = () =>
    dispatch({
      type: 'DATA_FILES_UPLOAD',
      payload: {
        system: params.system,
        path: params.path || '',
        files: uploadedFiles,
        reloadCallback
      }
    });

  const removeFile = idx => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== idx));
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

  return (
    <Modal isOpen={isOpen} toggle={toggle} onClosed={onClosed} size="lg">
      <ModalHeader toggle={toggle}>Upload Files</ModalHeader>
      <ModalBody>
        <input
          ref={uploadRef}
          hidden
          type="file"
          multiple
          onChange={() => {
            setUploadedFiles([...uploadedFiles, ...uploadRef.current.files]);
          }}
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
                <tr key={Math.random()}>
                  <td style={{ verticalAlign: 'middle' }}>{file.name}</td>
                  <td style={{ verticalAlign: 'middle' }}>
                    <FileLengthCell cell={{ value: file.size }} />
                  </td>
                  <td>
                    <DataFilesUploadStatus i={i} removeCallback={removeFile} />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button color="primary" onClick={uploadStart}>
          Upload
        </Button>{' '}
        <Button color="secondary" onClick={toggle}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default DataFilesUploadModal;
