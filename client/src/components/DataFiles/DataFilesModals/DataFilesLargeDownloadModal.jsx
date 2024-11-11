import React from 'react';
import { useDispatch } from 'react-redux';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { Button, SectionMessage } from '_common';
import { useModal } from 'hooks/datafiles';
import styles from './DataFilesLargeDownloadModal.module.scss';

const DataFilesLargeDownloadModal = () => {
  const dispatch = useDispatch();
  const { getStatus: getModalStatus } = useModal();
  const isOpen = getModalStatus('largeDownload');

  const toggle = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: {
        operation: 'largeDownload',
        props: {},
      },
    });
  };

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
