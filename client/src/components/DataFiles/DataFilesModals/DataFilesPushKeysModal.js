import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
  const pushKeys = event => {
    dispatch({
      type: 'DATA_FILES_PUSH_KEYS',
      payload: {
        system,
        password,
        token,
        type: 'STORAGE',
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
        onOpened={onOpen}
        onClosed={onClosed}
        toggle={toggle}
        className="dataFilesModal"
      >
        <Form>
          <ModalHeader toggle={toggle} charCode="&#xe912;">
            Push Keys
          </ModalHeader>
          <ModalBody>
            <FormGroup>
              <Label>Password</Label>
              <Input
                type="password"
                onChange={e => setPassword(e.target.value)}
                value={password}
                className="form-control"
              />
              <Label>TACC Token</Label>
              <Input
                onChange={e => setToken(e.target.value)}
                value={token}
                className="form-control"
              />
            </FormGroup>
          </ModalBody>
          <ModalFooter>
            <Button type="submit" color="primary" onClick={pushKeys}>
              Authenticate
            </Button>
          </ModalFooter>
        </Form>
      </Modal>
    </>
  );
};

export default DataFilesPushKeysModal;
