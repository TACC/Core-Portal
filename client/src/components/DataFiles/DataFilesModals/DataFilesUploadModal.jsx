/* FP-993: Create and use a common Uploader component */
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { Button, FileInputDropZone } from '_common';
import {
  useSystemDisplayName,
  useFileListing,
  useModal,
  useTapisToken,
} from 'hooks/datafiles';
import { useUpload } from 'hooks/datafiles/mutations';
import DataFilesUploadModalListingTable from './DataFilesUploadModalListing/DataFilesUploadModalListingTable';

import styles from './DataFilesUploadModal.module.scss';

export const LAYOUT_CLASS_MAP = {
  compact: 'is-compact',
  default: 'is-normal',
};
export const DEFAULT_LAYOUT = 'default';
export const LAYOUTS = ['', ...Object.keys(LAYOUT_CLASS_MAP)];

const DataFilesUploadModal = ({ className, layout }) => {
  const history = useHistory();
  const location = useLocation();

  const reloadCallback = () => {
    history.push(location.pathname);
  };

  const maxSizeLabel = useSelector(
    (state) => state.workbench.config.uploadModalMaxSizeLabel
  );
  const maxSize = useSelector(
    (state) => state.workbench.config.uploadModalMaxSizeValue
  );

  const { getStatus: getModalStatus, toggle } = useModal();
  const isOpen = getModalStatus('upload');
  const { params } = useFileListing('FilesListing');
  const { data: tapisToken } = useTapisToken();
  const { status, upload, setStatus } = useUpload();
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [rejectedFiles, setRejectedFiles] = useState([]);
  const dispatch = useDispatch();
  const uploadStart = () => {
    const filteredFiles = uploadedFiles.filter(
      (f) => status[f.id] !== 'SUCCESS' && !rejectedFiles.includes(f)
    );
    filteredFiles.length > 0 &&
      upload({
        system: params.system,
        path: params.path || '',
        files: filteredFiles,
        reloadCallback,
        tapisToken,
      });
  };
  const dropZoneDisabled =
    Object.values(status).filter((s) => s === 'UPLOADING').length > 0;
  const uploadButtonDisabled =
    dropZoneDisabled ||
    (!dropZoneDisabled &&
      uploadedFiles.length ===
        rejectedFiles.length +
          Object.values(status).filter((s) => s === 'SUCCESS').length);
  const hasFilesToList = uploadedFiles.length > 0;
  const showListing = hasFilesToList || layout === 'default';

  const modifierClasses = [];
  if (hasFilesToList) modifierClasses.push('has-entries');
  modifierClasses.push(LAYOUT_CLASS_MAP[layout || DEFAULT_LAYOUT]);
  const containerStyleNames = ['container', ...modifierClasses]
    .map((s) => styles[s])
    .join(' ');

  const systemDisplayName = useSystemDisplayName(params);

  const onClosed = () => {
    setUploadedFiles([]);
    setRejectedFiles([]);
    dispatch({ type: 'DATA_FILES_MODAL_CLOSE' });
    setStatus({});
  };

  const selectFiles = (acceptedFiles) => {
    const newFiles = [];
    const newAcceptedFiles = acceptedFiles.filter(
      (af) =>
        uploadedFiles.filter(
          (uf) => uf.data.path === af.path && uf.data.size === af.size
        ).length === 0
    );
    newAcceptedFiles.forEach((file) => {
      newFiles.push({ data: file, id: uuidv4() });
    });
    setUploadedFiles((files) => [...files, ...newFiles]);
  };

  const onRejectedFiles = (oversizedFiles) => {
    const newFiles = [];
    const newRejectedFiles = oversizedFiles.filter(
      (of) =>
        rejectedFiles.filter((rf) => rf.data.path === of.path).length === 0
    );
    newRejectedFiles.forEach((file) => {
      newFiles.push({ data: file, id: uuidv4() });
    });
    setUploadedFiles((files) => [...files, ...newFiles]);
    setRejectedFiles((files) => [...files, ...newFiles]);
  };

  return (
    <Modal
      isOpen={isOpen}
      toggle={() => toggle({ operation: 'upload', props: {} })}
      onClosed={onClosed}
      size="xl"
      className={`dataFilesModal ${className}`}
    >
      <ModalHeader
        toggle={() => toggle({ operation: 'upload', props: {} })}
        charCode="&#xe912;"
      >
        Upload Files
      </ModalHeader>
      <ModalBody className={containerStyleNames}>
        <div className={styles.dropzone} disabled={dropZoneDisabled}>
          <FileInputDropZone
            onSetFiles={selectFiles}
            onRejectedFiles={onRejectedFiles}
            maxSizeMessage={`Max File Size: ${maxSizeLabel || '2GB'}`}
            maxSize={maxSize || 2 * 1024 * 1024 * 1024}
          />
        </div>
        {showListing && (
          <div className={styles.listing}>
            <span className={styles['listing-header']}>
              {`Uploading to ${systemDisplayName}/${params.path}`.replace(
                '//',
                '/'
              )}
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
          type="primary"
          size="long"
          onClick={uploadStart}
          disabled={uploadButtonDisabled}
          isLoading={dropZoneDisabled}
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
  layout: PropTypes.oneOf(LAYOUTS),
};
DataFilesUploadModal.defaultProps = {
  className: '',
  layout: DEFAULT_LAYOUT,
};

export default DataFilesUploadModal;
