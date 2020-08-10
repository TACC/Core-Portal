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

const DataFilesRenameStatus = ({ status }) => {
  switch (status) {
    case 'RUNNING':
      return <LoadingSpinner placement="inline" />;
    case 'SUCCESS':
      return <span className="badge badge-success">SUCCESS</span>;
    case 'ERROR':
      return <span className="badge badge-danger">ERROR</span>;
    default:
      return <></>;
  }
};
DataFilesRenameStatus.propTypes = {
  status: PropTypes.string.isRequired
};

const DataFilesRenameModal = () => {
  const isOpen = useSelector(state => state.files.modals.rename);

  const selected = useSelector(
    state => state.files.modalProps.rename.selectedFile || {}
  );
  const [selectedFile, updateSelected] = useState(selected);
  useEffect(() => updateSelected(selected), [isOpen]);

  const [newName, setNewName] = useState(selectedFile.name || '');
  useEffect(() => setNewName(selectedFile.name || ''), [selectedFile.name]);

  const [validated, setValidated] = useState(true);

  const { api, scheme } = useSelector(state => state.files.params.FilesListing);

  const dispatch = useDispatch();
  const toggle = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'rename', props: {} }
    });
  };

  const status = useSelector(state => state.files.operationStatus.rename);

  const history = useHistory();
  const location = useLocation();
  const reloadPage = (name, newPath) => {
    history.push(location.pathname);
    updateSelected({ ...selectedFile, name, path: `/${newPath}` });
  };

  const validate = e => {
    setNewName(e.target.value);
    const regexp = new RegExp(/["'/\\]/);
    try {
      setValidated(!regexp.test(e.target.value));
    } catch {
      setValidated(false);
    }
  };

  const onClosed = () => {
    dispatch({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { status: null, operation: 'rename' }
    });
  };

  const rename = event => {
    dispatch({
      type: 'DATA_FILES_RENAME',
      payload: {
        selectedFile,
        newName,
        reloadCallback: reloadPage,
        api,
        scheme
      }
    });
    event.preventDefault();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClosed={onClosed}
      toggle={toggle}
      className="dataFilesModal"
    >
      <Form>
        <ModalHeader toggle={toggle}>Rename {selectedFile.name}</ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label>Enter the new name for this file:</Label>
            <div className="input-group mb-3">
              <Input
                onChange={validate}
                className="form-control"
                value={newName}
                placeholder={newName}
              />
              {status && (
                <div className="input-group-append">
                  <span className="input-group-text">
                    <DataFilesRenameStatus status={status} />
                  </span>
                </div>
              )}
            </div>
            <Message
              type="warn"
              hidden={newName === '' || validated}
              style={{ paddingTop: '10px' }}
            >
              Valid characters are: <kbd>A-Z a-z 0-9 . _ -</kbd>
            </Message>
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button
            type="submit"
            disabled={!newName || !validated}
            className="data-files-btn"
            onClick={rename}
          >
            Rename{' '}
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

export default DataFilesRenameModal;
