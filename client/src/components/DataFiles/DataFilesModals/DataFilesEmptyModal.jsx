import React, { useCallback, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { useHistory, useLocation } from 'react-router-dom';
import { Button, SectionMessage } from '_common';

const DataFilesEmptyModal = React.memo(() => {
  const history = useHistory();
  const location = useLocation();
  const reloadPage = () => {
    history.push(location.pathname);
  };

  const dispatch = useDispatch();

  const isOpen = useSelector((state) => state.files.modals.empty);
  const trashedFiles = useSelector((state) => state.files.listing.FilesListing);
  const [disabled, setDisabled] = useState(false);
  const toggle = () =>
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'empty', props: {} },
    });

  const onClosed = () => {
    setDisabled(false);
    dispatch({ type: 'DATA_FILES_MODAL_CLOSE' });
    dispatch({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { operation: 'empty', status: {} },
    });
  };

  const emptyCallback = useCallback(() => {
    setDisabled(true);
    dispatch({
      type: 'DATA_FILES_EMPTY',
      payload: {
        src: trashedFiles,
        reloadCallback: reloadPage,
      },
    });
  }, [reloadPage, trashedFiles]);

  const status = useSelector((state) => state.files.operationStatus.empty);
  const isRunning = Object.values(status).some(
    (status) => status === 'RUNNING'
  );

  return (
    <Modal
      isOpen={isOpen}
      onClosed={onClosed}
      toggle={toggle}
      size="md"
      className="dataFilesModal"
    >
      <ModalHeader toggle={toggle} charCode="&#xe912;">
        Empty Trash
      </ModalHeader>
      <ModalBody style={{ height: '18.5vh' }}>
        <p>
          Emptying the trash directory will{' '}
          <strong>
            <em>permanently</em>
          </strong>
          &nbsp; delete all files within. This action cannot be reversed. TACC
          is not responsible for lost files.
        </p>
        <SectionMessage type="warning">
          Are you sure you want to permanently delete these files?
        </SectionMessage>
      </ModalBody>
      <ModalFooter>
        <Button
          disabled={disabled}
          onClick={emptyCallback}
          type="primary"
          size="medium"
          isLoading={isRunning}
        >
          Delete Files
        </Button>
      </ModalFooter>
    </Modal>
  );
});

export default DataFilesEmptyModal;
