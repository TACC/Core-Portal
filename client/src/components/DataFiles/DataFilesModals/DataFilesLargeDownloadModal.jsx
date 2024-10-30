import React from 'react';
import { useDispatch } from 'react-redux';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { Button, SectionMessage } from '_common';
import { useModal } from 'hooks/datafiles';
import styles from './DataFilesLargeDownloadModal.module.scss';

const DataFilesLargeDownloadModal = () => {
  // Assigns React-Redux dispatch calls
  const dispatch = useDispatch();
  // Creates the modal
  const { getStatus: getModalStatus } = useModal();
  // Determine if modal is open or closed
  const isOpen = getModalStatus('largeDownload');

  // Toggles the modal on or off
  const toggle = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: {
        operation: 'largeDownload',
        props: {},
      },
    });
  };

  // Opens a new tab in current browser to Globus
  const openTabToGlobus = () => {
    window.open('https://docs.tacc.utexas.edu/basics/datatransfer/#globus');
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} className="dataFilesModal">
      <ModalHeader toggle={toggle} charCode="&#xe912;">
        Large Download
      </ModalHeader>
      <ModalBody>
        <SectionMessage type="warn">
          Your download is larger than 2 gigabytes.
        </SectionMessage>
        <p className={styles['info']}>
          Use Globus to quickly transfer large volumes of data.
        </p>
      </ModalBody>
      <ModalFooter>
        <Button
          type="primary"
          attr="submit"
          onClick={openTabToGlobus}
          className={styles['linkButton']}
        >
          Globus Data Transfer Guide
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default DataFilesLargeDownloadModal;
