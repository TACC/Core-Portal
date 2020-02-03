import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

const DataFilesPushKeysModal = () => {
  const dispatch = useDispatch();
  const onOpen = () => {};
  const isOpen = useSelector(state => state.files.modals.pushKeys);
  const { system } = useSelector(state => state.files.params.FilesListing);
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');

  const history = useHistory();
  const location = useLocation();
  const reloadPage = () => {
    history.push(location.pathname);
  };

  const onClosed = () => {
    setPassword('');
    setToken('');
  };
  const toggle = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'pushKeys', props: {} }
    });
  };
  const pushKeys = () => {
    dispatch({
      type: 'SYSTEMS_PUSH_KEYS',
      payload: {
        system,
        password,
        token,
        type: 'STORAGE',
        reloadCallback: reloadPage
      }
    });
  };
  return (
    <>
      <Modal
        size="lg"
        isOpen={isOpen}
        onOpened={onOpen}
        onClosed={onClosed}
        toggle={toggle}
      >
        <ModalHeader toggle={toggle}>Push Keys</ModalHeader>
        <ModalBody>
          Password
          <input
            type="password"
            onChange={e => setPassword(e.target.value)}
            value={password}
            className="form-control"
          />
          TACC token
          <input
            onChange={e => setToken(e.target.value)}
            value={token}
            className="form-control"
          />
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={pushKeys}>
            Authenticate
          </Button>
          <Button
            color="secondary"
            className="data-files-btn-cancel"
            onClick={toggle}
          >
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default DataFilesPushKeysModal;
