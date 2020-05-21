import React, { useMemo } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { LoadingSpinner } from '_common';
import { useHistory, useLocation } from 'react-router-dom';
import { isString } from 'lodash';

const DataFilesCompressModal = () => {
  const history = useHistory();
  const location = useLocation();
  const dispatch = useDispatch();
  const status = useSelector(
    state => state.files.operationStatus.compress,
    shallowEqual
  );

  const params = useSelector(
    state => state.files.params.FilesListing,
    shallowEqual
  );

  const isOpen = useSelector(state => state.files.modals.compress);
  const selectedFiles = useSelector(({ files: { selected, listing } }) =>
    selected.FilesListing.map(i => ({
      ...listing.FilesListing[i]
    }))
  );
  const selected = useMemo(() => selectedFiles, [isOpen]);

  const toggle = () =>
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'compress', props: {} }
    });

  const onOpened = () => {
    dispatch({
      type: 'FETCH_FILES_MODAL',
      payload: { ...params, section: 'modal' }
    });
  };

  const onClosed = () => {
    dispatch({ type: 'DATA_FILES_MODAL_CLOSE' });
    if (isString(status)) {
      dispatch({
        type: 'DATA_FILES_SET_OPERATION_STATUS',
        payload: { status: {}, operation: 'compress' }
      });
      history.push(location.pathname);
    }
  };

  const compressCallback = () => {
    dispatch({
      type: 'DATA_FILES_COMPRESS',
      payload: { files: selected }
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpened={onOpened}
      onClosed={onClosed}
      toggle={toggle}
      className="dataFilesModal"
    >
      <ModalHeader toggle={toggle}>Compress Files</ModalHeader>
      <ModalBody>
        {/* TODO: Form for filename and filetype */}
        <p>
          A job to compress your files will be submitted on your behalf. You can
          check the status of this job on your Dashboard, and your compressed
          file will appear in this directory.
        </p>
        {status === 'SUCCESS' && (
          <span style={{ color: 'green' }}>
            Successfully started compress job
          </span>
        )}
      </ModalBody>
      <ModalFooter>
        <Button
          onClick={compressCallback}
          className="data-files-btn"
          disabled={status === 'RUNNING'}
          style={{ display: 'flex' }}
        >
          {status === 'RUNNING' && <LoadingSpinner placement="inline" />}
          <span>Compress</span>
        </Button>
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

export default DataFilesCompressModal;
