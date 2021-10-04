import React, { useMemo } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { LoadingSpinner, Icon, InlineMessage } from '_common';
import { useHistory, useLocation } from 'react-router-dom';
import styles from './DataFilesCompressModal.module.scss';

const DataFilesExtractModal = () => {
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
    if (status) {
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

  let buttonIcon;
  if (status === 'RUNNING') {
    buttonIcon = <LoadingSpinner placement="inline" />;
  } else if (status === 'ERROR') {
    buttonIcon = <Icon name="alert" />;
  } else {
    buttonIcon = null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onOpened={onOpened}
      onClosed={onClosed}
      toggle={toggle}
      className="dataFilesModal"
    >
      <ModalHeader toggle={toggle} charCode="&#xe912;">
        Extract Files
      </ModalHeader>
      <ModalBody>
        <p>
          A job to extract your file will be submitted on your behalf. You can
          check the status of this job on your Dashboard, and your extracted
          files will appear in this directory.
        </p>
      </ModalBody>
      <ModalFooter>
        <InlineMessage isVisible={status === 'SUCCESS'} type="success">
          Successfully started extract job
        </InlineMessage>
        <Button
          onClick={extractCallback}
          className={`data-files-btn ${styles['submit-button']}`}
          disabled={status === 'RUNNING' || status === 'SUCCESS'}
        >
          {buttonIcon}
          <span className={buttonIcon ? styles['with-icon'] : ''}>Extract</span>
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default DataFilesExtractModal;
