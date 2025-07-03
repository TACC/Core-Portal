import React, { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { Button, InlineMessage } from '_common';
import { useHistory, useLocation } from 'react-router-dom';
import { useSelectedFiles, useFileListing, useModal } from 'hooks/datafiles';
import { useExtract } from 'hooks/datafiles/mutations';

const DataFilesExtractModal = () => {
  const history = useHistory();
  const location = useLocation();
  const dispatch = useDispatch();
  const { extract, status, setStatus } = useExtract();
  const { toggle: toggleModal, getStatus: getModalStatus } = useModal();
  const { params } = useFileListing('FilesListing');

  const isOpen = getModalStatus('extract');
  const { selectedFiles } = useSelectedFiles();
  const selected = useMemo(() => selectedFiles, [isOpen]);

  const onOpened = () => {
    dispatch({
      type: 'FETCH_FILES_MODAL',
      payload: { ...params, section: 'modal' },
    });
  };

  const toggle = () => toggleModal({ operation: 'extract', props: {} });

  const onClosed = () => {
    dispatch({ type: 'DATA_FILES_MODAL_CLOSE' });
    if (status) {
      setStatus({});
      history.push(location.pathname);
    }
  };
  const extractCallback = () => {
    extract({ file: selected[0] });
  };

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
        <InlineMessage isVisible={status.type === 'SUCCESS'} type="success">
          Successfully started extract job
        </InlineMessage>
        <InlineMessage
          isVisible={status.type === 'ERROR'}
          type="error"
        >
          {status.message}
        </InlineMessage>        
        <Button
          onClick={extractCallback}
          disabled={status.type === 'RUNNING' || status.type === 'SUCCESS'}
          isLoading={status.type === 'RUNNING'}
          type="primary"
          size="medium"
          iconNameBefore={status.type === 'ERROR' ? 'alert' : null}
        >
          Extract
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default DataFilesExtractModal;
