/* FP-993: Create and use a common Uploader component */
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

export const LAYOUT_CLASS_MAP = {
  compact: 'is-compact',
  default: 'is-normal'
};
export const DEFAULT_LAYOUT = 'default';
export const LAYOUTS = ['', ...Object.keys(LAYOUT_CLASS_MAP)];

const DataFilesUploadModal = ({ className, layout }) => {
  const history = useHistory();
  const location = useLocation();

  const reloadCallback = () => {
    history.push(location.pathname);
  };

  const isOpen = useSelector(state => state.files.modals.upload);
  const params = useSelector(state => state.files.params.FilesListing);
  const status = useSelector(state => state.files.operationStatus.upload);
  const systemList = useSelector(state => state.systems.storage.configuration);
  const projectsList = useSelector(state => state.projects.listing.projects);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [rejectedFiles, setRejectedFiles] = useState([]);
  const dispatch = useDispatch();
  const uploadStart = () => {
    const filteredFiles = uploadedFiles.filter(
      f => status[f.id] !== 'SUCCESS' && !rejectedFiles.includes(f)
    );
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
  const disabled =
    Object.values(status).filter(s => s === 'UPLOADING').length > 0;
  const hasFilesToList = uploadedFiles.length > 0;
  const showListing = hasFilesToList || layout === 'default';

  const modifierClasses = [];
  if (hasFilesToList) modifierClasses.push('has-entries');
  modifierClasses.push(LAYOUT_CLASS_MAP[layout || DEFAULT_LAYOUT]);
  const containerStyleNames = ['container', ...modifierClasses].join(' ');

  const systemDisplayName = findSystemOrProjectDisplayName(
    params.scheme,
    systemList,
    projectsList,
    params.system
  );
  const onClosed = () => {
    setUploadedFiles([]);
    setRejectedFiles([]);
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
    const newAcceptedFiles = acceptedFiles.filter(
      af =>
        uploadedFiles.filter(
          uf => uf.data.path === af.path && uf.data.size === af.size
        ).length === 0
    );
    newAcceptedFiles.forEach(file => {
      newFiles.push({ data: file, id: uuidv4() });
    });
    setUploadedFiles(files => [...files, ...newFiles]);
  };

  const onRejectedFiles = oversizedFiles => {
    const newFiles = [];
    const newRejectedFiles = oversizedFiles.filter(
      of => rejectedFiles.filter(rf => rf.data.path === of.path).length === 0
    );
    newRejectedFiles.forEach(file => {
      newFiles.push({ data: file, id: uuidv4() });
    });
    setUploadedFiles(files => [...files, ...newFiles]);
    setRejectedFiles(files => [...files, ...newFiles]);
  };

  return (
    <Modal
      isOpen={isOpen}
      toggle={toggle}
      onClosed={onClosed}
      size="xl"
      className={`dataFilesModal ${className}`}
    >
      <ModalHeader toggle={toggle}>Upload Files</ModalHeader>
      <ModalBody styleName={containerStyleNames}>
        <div styleName="dropzone" disabled={disabled}>
          <FileInputDropZone
            onSetFiles={selectFiles}
            onRejectedFiles={onRejectedFiles}
            maxSize={524288000}
            maxSizeMessage="Max File Size: 500MB"
          />
        </div>
        {showListing && (
          <div styleName="listing">
            <span styleName="listing-header">
              Uploading to {systemDisplayName}/{params.path}
            </span>
            <DataFilesUploadModalListingTable
              uploadedFiles={uploadedFiles}
              rejectedFiles={rejectedFiles}
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
  /** Layout */
  layout: PropTypes.oneOf(LAYOUTS)
};
DataFilesUploadModal.defaultProps = {
  className: '',
  layout: DEFAULT_LAYOUT
};

export default DataFilesUploadModal;
