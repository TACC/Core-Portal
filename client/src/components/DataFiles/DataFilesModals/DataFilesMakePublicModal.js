import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

const DataFilesMakePublicModal = () => {
  const isOpen = useSelector(state => state.files.modals.makePublic);

  const selected = useSelector(
    state => state.files.modalProps.makePublic.selectedFile || {}
  );

  const dispatch = useDispatch();
  const toggle = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'makePublic', props: {} }
    });
  };

  const onClosed = () => {
    dispatch({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { status: null, operation: 'makePublic' }
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
        <p className="alert alert-danger">
          Publishing this file will copy it to the Public Data directory and
          make it available to the general public.{' '}
          <b>THIS ACTION CANNOT BE REVERSED.</b> Click &quot;Proceed&quot; to
          continue.
        </p>
      </ModalBody>
      <ModalFooter>
        <Button onClick={makePublic} className="data-files-btn">
          Proceed
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default DataFilesMakePublicModal;
