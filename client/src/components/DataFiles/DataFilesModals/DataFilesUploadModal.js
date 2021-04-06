import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { FileInputDropZone } from '_common';
import { findSystemOrProjectDisplayName } from 'utils/systems';
import DataFilesUploadModalListingTable from './DataFilesUploadModalListing/DataFilesUploadModalListingTable';

import './DataFilesUploadModal.module.scss';

export const DIRECTION_CLASS_MAP = {
  vertical: 'is-vert',
  horizontal: 'is-horz'
};
export const DEFAULT_DIRECTION = 'vertical';
export const DIRECTIONS = ['', ...Object.keys(DIRECTION_CLASS_MAP)];

export const DENSITY_CLASS_MAP = {
  compact: 'is-narrow',
  default: 'is-wide'
};
export const DEFAULT_DENSITY = 'default';
export const DENSITIES = ['', ...Object.keys(DENSITY_CLASS_MAP)];

const DataFilesUploadModal = ({ className, density, direction }) => {
  const [disabled, setDisabled] = useState(false);
  const modifierClasses = [];
  modifierClasses.push(DENSITY_CLASS_MAP[density || DEFAULT_DENSITY]);
  modifierClasses.push(DIRECTION_CLASS_MAP[direction || DEFAULT_DIRECTION]);
  const containerStyleNames = ['container', ...modifierClasses].join(' ');

  const history = useHistory();
  const location = useLocation();

  const [uploadedFiles, setUploadedFiles] = useState([]);

  const reloadCallback = () => {
    history.push(location.pathname);
    const errorFiles = uploadedFiles.filter(f => status[f.id] === 'ERROR');
    errorFiles.length === uploadedFiles.length && setDisabled(false);
  };

  const isOpen = useSelector(state => state.files.modals.upload);
  const params = useSelector(state => state.files.params.FilesListing);
  const status = useSelector(state => state.files.operationStatus.upload);
  const systemList = useSelector(state => state.systems.storage.configuration);
  const projectsList = useSelector(state => state.projects.listing.projects);
  const dispatch = useDispatch();
  const uploadStart = () => {
    setDisabled(true);
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

  const showListing =
    uploadedFiles.length > 0 ||
    (density === DEFAULT_DENSITY && direction === DEFAULT_DIRECTION);
  const isCompactView =
    uploadedFiles.length > 0 &&
    !(density === DEFAULT_DENSITY && direction === DEFAULT_DIRECTION);
  const systemDisplayName = findSystemOrProjectDisplayName(
    params.scheme,
    systemList,
    projectsList,
    params.system
  );
  const onClosed = () => {
    setDisabled(false);
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
    setDisabled(false);
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
      <ModalBody styleName={containerStyleNames}>
        <div
          styleName={isCompactView ? 'compact-view' : ''}
          disabled={disabled}
        >
          <FileInputDropZone
            onSetFiles={selectFiles}
            onRejectedFiles={onRejectedFiles}
            maxSize={524288000}
            maxSizeMessage="Max File Size: 500MB"
          />
        </div>
        {showListing && (
          <div styleName="data-files-listing">
            <span styleName="listing-header">
              Uploading to {systemDisplayName}/{params.path}
            </span>
            <DataFilesUploadModalListingTable
              uploadedFiles={uploadedFiles}
              setUploadedFiles={setUploadedFiles}
            />
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button
          className="data-files-btn"
          onClick={uploadStart}
          disabled={disabled}
        >
          Upload Selected
        </Button>
      </ModalFooter>
    </Modal>
  );
};

DataFilesUploadModal.propTypes = {
  /** Additional className for the root element */
  className: PropTypes.string,
  /** Selector type */
  /* FAQ: We can support any values, even a component */
  // eslint-disable-next-line react/forbid-prop-types
  /** Layout density */
  density: PropTypes.oneOf(DENSITIES),
  /** Layout direction */
  direction: PropTypes.oneOf(DIRECTIONS)
};
DataFilesUploadModal.defaultProps = {
  className: '',
  density: DEFAULT_DENSITY,
  direction: DEFAULT_DIRECTION
};

export default DataFilesUploadModal;
