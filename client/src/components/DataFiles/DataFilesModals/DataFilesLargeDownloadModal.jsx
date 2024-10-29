import React from 'react';
import { useDispatch } from 'react-redux';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter
} from 'reactstrap';
import { Button } from '_common';
// import { useHistory, useLocation } from 'react-router-dom';
import { useModal } from 'hooks/datafiles';
import styles from './DataFilesLargeDownloadModal.module.scss'

const DataFilesLargeDownloadModal = () => {
  // const history = useHistory();
  // const location = useLocation();
  const dispatch = useDispatch();

  const { getStatus: getModalStatus } = useModal();

  const isOpen = getModalStatus('largeDownload');

  const toggle = () => {
    dispatch({
      type: 'DATA_FILES_LARGE_DOWNLOAD',
      payload: { operation: 'largeDownload', props: {} },
    });
  };
  
  const onClosed = () => {
    console.log('Click me');
    debugger;
    dispatch({ type: 'DATA_FILES_MODAL_CLOSE' });
    // setStatus({});
    // history.push(location.pathname);
    console.log('something');
  };

  // Opens a new tab in current browser to Globus
  const openTabToGlobus = () => {
    window.open('https://docs.tacc.utexas.edu/basics/datatransfer/#globus');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClosed={onClosed}
      toggle={toggle}
      className='dataFilesModal'
    >
      <ModalHeader toggle={toggle} charCode="&#xe912;">
        Large Download
      </ModalHeader>
      <ModalBody>
        <p 
          // className='container is-warn is-scope-section'
          className={styles['firstParagraph']} 
          role='status' 
          aria-label='message'
        >
          Your download is larger than 2 gigabytes.
        </p>
        <p className={styles['lastParagraph']}>
          Use Globus to quickly transfer large volumes of data.
        </p>
      </ModalBody>
      <ModalFooter>
        <Button 
          type="primary"
          // size={'long'}
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