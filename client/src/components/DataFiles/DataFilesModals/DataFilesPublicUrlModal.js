import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Input,
  Label
} from 'reactstrap';
import PropTypes from 'prop-types';
import { LoadingSpinner, Message, InputCopy } from '_common';
import './DataFilesPublicUrlModal.module.scss';

const DataFilesPublicUrlAction = ({ scheme, file, text, status, method }) => {
  const dispatch = useDispatch();
  const onClick = (event) => {
    dispatch({
      type: 'DATA_FILES_PUBLIC_URL',
      payload: {
        file,
        scheme,
        method
      }
    });
    event.preventDefault();
  }

  return (
    <Button
      type="submit"
      disabled={status && status.method}
      className="data-files-btn"
      onClick={(event) => onClick(event)}
      styleName="action-root"
    >
      {text}
      {status && status.method === method
        ? <LoadingSpinner placement="inline"/>
        : null
      }
    </Button>
  )
}

const DataFilesPublicUrlStatus = ({ 
  scheme,
  file,
  status
}) => {
  if (status && status.error) {
    // Error occurred during retrieval of link
    return <Message type="error">There was a problem retrieving the link for this file.</Message>
  }
  return <FormGroup>
    <Label>
      Link
      {
        status && status.method === 'get' 
          ? <LoadingSpinner placement="inline" /> 
          : null
      }
    </Label>
    <InputCopy placeholder="Click generate to make a link" value={status.url} />
    { 
      status && status.url
        ? <DataFilesPublicUrlAction
            scheme={scheme}
            file={file}
            text='Delete'
            status={status}
            method='delete' />
        : null
    }
    <DataFilesPublicUrlAction
      scheme={scheme}
      file={file}
      text={status && status.url ? 'Replace Link' : 'Generate Link'}
      status={status}
      method='post' />
  </FormGroup> 
}

const DataFilesPublicUrlModal = () => {
  const isOpen = useSelector(state => state.files.modals.publicUrl);
  const status = useSelector(state => state.files.operationStatus.publicUrl);
  const { scheme } = useSelector(state => state.files.params.FilesListing);
  const selectedFile = useSelector(state => 
    state.files.modalProps.publicUrl.selectedFile || {}
  );
  const dispatch = useDispatch();
  const toggle = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'publicUrl', props: {} }
    });
  };

  const onClosed = () => {
    dispatch({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { status: null, operation: 'publicUrl' }
    });
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClosed={onClosed}
      toggle={toggle}
      className="dataFilesModal"
    >
      <Form>
        <ModalHeader toggle={toggle}>Link for {selectedFile.name}</ModalHeader>
        <ModalBody>
          <DataFilesPublicUrlStatus 
            scheme={scheme}
            file={selectedFile}
            status={status}
          />
        </ModalBody>
        <ModalFooter>
          <Button
            color="secondary"
            className="data-files-btn-cancel"
            onClick={toggle}
          >
            Close
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  );
};

export default DataFilesPublicUrlModal;
