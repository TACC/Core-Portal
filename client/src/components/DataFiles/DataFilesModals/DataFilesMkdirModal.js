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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

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

  const mkdir = () =>
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
              <div
                hidden={dirname === '' || validated}
                style={{ paddingTop: '10px' }}
              >
                <span style={{ color: '#9d85ef' }}>
                  <FontAwesomeIcon
                    icon={faExclamationTriangle}
                    style={{ marginRight: '10px' }}
                    color="#9d85ef"
                  />
                  Valid characters for folder names are <b>A-Z a-z 0-9 . _ -</b>
                </span>
              </div>
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
