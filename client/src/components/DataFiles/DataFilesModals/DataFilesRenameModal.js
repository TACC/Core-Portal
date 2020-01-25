import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog } from '@fortawesome/free-solid-svg-icons';

const DataFilesRenameModal = () => {
  const selectedFile = useSelector(
    state => state.files.modalProps.rename.selectedFile || {}
  );
  const [newName, setNewName] = useState(selectedFile.name || '');
  useEffect(() => setNewName(selectedFile.name || ''), [selectedFile.name]);

  const { api, scheme } = useSelector(state => state.files.params.FilesListing);
  const isOpen = useSelector(state => state.files.modals.rename);

  const dispatch = useDispatch();

  const toggle = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'rename', props: {} }
    });
  };

  const loading = useSelector(state => state.files.loading.RenameModal);

  const history = useHistory();
  const location = useLocation();
  const reloadPage = () => {
    history.push(location.pathname);
  };

  const rename = () =>
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

  return (
    <Modal isOpen={isOpen} toggle={toggle}>
      <ModalHeader toggle={toggle}>Rename {selectedFile.name}</ModalHeader>
      <ModalBody>
        Enter the new name for this file:
        <input
          onChange={e => setNewName(e.target.value)}
          className="form-control"
          value={newName}
          placeholder={newName}
        />
      </ModalBody>
      <ModalFooter>
        <Button id="data-files-add" color="primary" onClick={rename}>
          Rename{' '}
          {loading ? <FontAwesomeIcon spin icon={faCog} size="sm" /> : ''}
        </Button>{' '}
        <Button
          color="secondary"
          style={{ borderRadius: '0' }}
          onClick={toggle}
        >
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default DataFilesRenameModal;
