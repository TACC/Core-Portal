import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
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

const DataFilesPublicUrlStatus = ({ 
  scheme,
  file,
  url,
  loading,
  error
}) => {
  const publicUrlOperation = (method) => {
    dispatch({
      type: 'DATA_FILES_PUBLIC_URL',
      payload: {
        file,
        scheme,
        method
      }
    });
  }
  if (loading) {
    return <LoadingSpinner />
  }
  if (error) {
    // Error occurred during retrieval of link
    return <Message type="error">There was a problem retrieving the link for this file.</Message>
  }
  return <FormGroup>
    <Label>Link</Label>
    <InputCopy placeholder="Click generate to make a link" value={url} />
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

  const loading = !status;
  const error = status && "status" in status;
  const url = status ? status.data : null;

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
            url={url}
            loading={loading}
            error={error}/>
        </ModalBody>
        <ModalFooter>
          <Button
            type="submit"
            disabled={false}
            className="data-files-btn"
            onClick={() => publicUrlOperation('post')}
          >
            Generate{' '}
          </Button>{' '}
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
