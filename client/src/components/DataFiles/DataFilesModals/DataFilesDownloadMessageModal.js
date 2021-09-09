import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { Icon } from '_common';
import './DataFilesDownloadMessageModal.module.scss';

const DataFilesDownloadMessageModal = () => {
  const isOpen = useSelector(state => state.files.modals.downloadMessage);

  const dispatch = useDispatch();
  const toggle = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'downloadMessage', props: {} }
    });
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="md" className="dataFilesModal">
      <ModalHeader toggle={toggle} charCode="&#xe912;">
        Download
      </ModalHeader>
      <ModalBody>
        <p styleName="title">Folders must be compressed before download.</p>
        <ol>
          <li>Select the folder(s).</li>
          <li>
            Press the &quot;
            <Icon name="compress">↩</Icon> Compress&quot; icon above the table.
          </li>
          <li>Complete and submit the form.</li>
          <li>After the job finishes, you may download the compressed file.</li>
        </ol>
      </ModalBody>
      <ModalFooter>
        <Button type="button" className="data-files-btn" onClick={toggle}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default DataFilesDownloadMessageModal;
