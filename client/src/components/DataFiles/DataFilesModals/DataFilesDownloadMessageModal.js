import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { SectionMessage } from '_common';

const DataFilesDownloadMessageModal = () => {
  const isOpen = useSelector(state => state.files.modals.downloadMessage);

  const selected = useSelector(
    state => state.files.modalProps.makePublic.selectedFile || {}
  );

  const dispatch = useDispatch();
  const toggle = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'downloadMessage', props: {} }
    });
  };

  const onClosed = () => {
    dispatch({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { status: null, operation: 'downloadMessage' }
    });
  };

  const makePublic = () => {
    dispatch({
      type: 'DATA_FILES_MAKE_PUBLIC',
      payload: {
        system: selected.system,
        path: selected.path
      }
    });
    toggle();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClosed={onClosed}
      toggle={toggle}
      size="lg"
      className="dataFilesModal"
    >
      <ModalHeader toggle={toggle}>Publish {selected.name}</ModalHeader>
      <ModalBody>
        <SectionMessage type="warning">
          Publishing this file will copy it to the Public Data directory and
          make it available to the general public.{' '}
          <b>messageeeee</b>
        </SectionMessage>
      </ModalBody>
      <ModalFooter>
        <Button onClick={makePublic} className="data-files-btn">
          Proceed
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default DataFilesDownloadMessageModal;
