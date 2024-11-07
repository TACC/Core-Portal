import React from 'react';
import { useDispatch } from 'react-redux';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import { useModal } from 'hooks/datafiles';
import { SectionMessage } from '_common';
import styles from './DataFilesNoFoldersModal.module.scss';

const DataFilesNoFoldersModal = () => {
  const dispatch = useDispatch();
  const { getStatus: getModalStatus } = useModal();
  // Determine if modal is open or closed
  const isOpen = getModalStatus('noFolders');

  // Toggles the modal on or off
  const toggle = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: {
        operation: 'noFolders',
        props: {},
      },
    });
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} className="dataFilesModal">
      <ModalHeader toggle={toggle} charCode="&#xe912;">
        No Folders
      </ModalHeader>
      <ModalBody>
        <SectionMessage type="warn">
          Folders can no longer be compressed.
        </SectionMessage>
        <p className={styles['info']}>
          Please individually select which files you would like to download.
        </p>
      </ModalBody>
    </Modal>
  );
};

export default DataFilesNoFoldersModal;
