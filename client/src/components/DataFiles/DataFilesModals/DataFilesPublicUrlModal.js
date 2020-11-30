import React, { useState, useEffect } from 'react';
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
import { LoadingSpinner, Message } from '_common';

const DataFilesPublicUrlModal = () => {
  const isOpen = useSelector(state => state.files.modals.publicUrl);

  const selectedFile = useSelector(state => 
    state.files.modalProps.publicUrl.selectedFile || {}
  );
  
  const { api, scheme } = useSelector(state => state.files.params.FilesListing);

  const dispatch = useDispatch();
  const toggle = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'publicUrl', props: {} }
    });
  };

  const status = useSelector(state => state.files.operationStatus.publicUrl);

  const history = useHistory();
  const location = useLocation();
  const reloadPage = (name, newPath) => {
    history.push(location.pathname);
    updateSelected({ ...selectedFile, name, path: `/${newPath}` });
  };


  const onClosed = () => {
    dispatch({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { status: null, operation: 'publicUrl' }
    });
  };

  const generatePublicUrl = event => {
    dispatch({
      type: 'DATA_FILES_PUBLIC_URL_GENERATE',
      payload: {
        selectedFile,
        scheme
      }
    });
    event.preventDefault();
  }

  const deletePublicUrl = event => {
    dispatch({
      type: 'DATA_FILES_PUBLIC_URL_REMOVE',
      payload: {
        selectedFile,
        scheme
      }
    });
    event.preventDefault();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClosed={onClosed}
      toggle={toggle}
      className="dataFilesModal"
    >
      <Form>
        <ModalHeader toggle={toggle}>Public URL for {selectedFile.name}</ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label>Enter the new name for this file:</Label>
            <Message
              type="warn"
              hidden={false}
              className="dataFilesValidationMessage"
            >
              Big Ol' Warning about overwriting an existing public url
            </Message>
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button
            type="submit"
            disabled={false}
            className="data-files-btn"
            onClick={generatePublicUrl}
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
