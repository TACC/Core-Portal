import React, { useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
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
import { Message } from '_common';

const DataFilesMkdirModal = () => {
  const dispatch = useDispatch();
  const params = useSelector(
    state => state.files.params.FilesListing,
    shallowEqual
  );
  const isOpen = useSelector(state => state.files.modals.mkdir);
  const [dirname, setDirname] = useState('');
  const [validated, setValidated] = useState(true);
  const toggle = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'mkdir', props: {} }
    });
  };

  const validate = e => {
    setDirname(e.target.value);
    const regexp = new RegExp(/["'/\\]/);
    try {
      setValidated(!regexp.test(e.target.value));
    } catch {
      setValidated(false);
    }
  };

  const onClosed = () => {
    setDirname('');
    setValidated(true);
  };

  const history = useHistory();
  const location = useLocation();
  const reloadPage = () => {
    history.push(location.pathname);
  };

  const mkdir = event => {
    dispatch({
      type: 'DATA_FILES_MKDIR',
      payload: {
        api: params.api,
        scheme: params.scheme,
        system: params.system,
        path: params.path || '/',
        dirname,
        reloadCallback: reloadPage
      }
    });
    event.preventDefault();
  };

  return (
    <>
      <Modal
        size="lg"
        isOpen={isOpen}
        toggle={toggle}
        onClosed={onClosed}
        className="dataFilesModal"
      >
        <Form>
          <ModalHeader toggle={toggle}>
            Creating folder in: {params.path}
          </ModalHeader>
          <ModalBody>
            <FormGroup>
              <Label>Enter the new name for the new folder:</Label>
              <Input
                onChange={validate}
                className="form-control"
                value={dirname}
              />
              <Message
                type="warn"
                hidden={dirname === '' || validated}
                className="dataFilesValidationMessage"
              >
                Valid characters are: <kbd>A-Z a-z 0-9 . _ -</kbd>
              </Message>
            </FormGroup>
          </ModalBody>
          <ModalFooter>
            <Button
              type="submit"
              disabled={!dirname || !validated}
              className="data-files-btn"
              onClick={mkdir}
            >
              Create Folder{' '}
            </Button>
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
    </>
  );
};

export default DataFilesMkdirModal;
