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
    state => state.files.operationStatus.extract,
    shallowEqual
  );

  const params = useSelector(
    state => state.files.params.FilesListing,
    shallowEqual
  );

  const isOpen = useSelector(state => state.files.modals.extract);
  const selectedFiles = useSelector(({ files: { selected, listing } }) =>
    selected.FilesListing.map(i => ({
      ...listing.FilesListing[i]
    }))
  );
  const selected = useMemo(() => selectedFiles, [isOpen]);

  const toggle = () =>
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'extract', props: {} }
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
        payload: { status: {}, operation: 'extract' }
      });
      history.push(location.pathname);
    }
  };
  const extractCallback = () => {
    dispatch({
      type: 'DATA_FILES_EXTRACT',
      payload: { file: selected[0] }
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
      <ModalHeader toggle={toggle}>Extract Files</ModalHeader>
      <ModalBody>
        <p>
          A job to extract your file will be submitted on your behalf. You can
          check the status of this job on your Dashboard, and your extracted
          files will appear in this directory.
        </p>
        {status === 'SUCCESS' && (
          <span style={{ color: 'green' }}>
            Successfully started extract job
          </span>
        )}
      </ModalBody>
      <ModalFooter>
        <Button
          onClick={extractCallback}
          className="data-files-btn"
          disabled={status === 'RUNNING'}
          style={{ display: 'flex' }}
        >
          {status === 'RUNNING' && <LoadingSpinner placement="inline" />}
          <span>Extract</span>
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
