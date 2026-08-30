import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import styles from './DataFilesProjectDescriptionModal.module.scss';

const DataFilesProjectDescriptionModal = () => {
  const dispatch = useDispatch();

  const isOpen = useSelector((state) => state.files.modals.projectDescription);
  const props = useSelector(
    (state) => state.files.modalProps.projectDescription
  );

  const toggle = useCallback(() => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'projectDescription', props: {} },
    });
  }, []);

  return (
    <>
      <Modal
        size="lg"
        isOpen={isOpen}
        toggle={toggle}
        className={styles['modal-dialog']}
      >
        <ModalHeader toggle={toggle} charCode="&#xe912;">
          {props?.title}
        </ModalHeader>
        <ModalBody className={styles['modal-body']}>
          <p>{props?.description}</p>
        </ModalBody>
      </Modal>
    </>
  );
};

export default DataFilesProjectDescriptionModal;
