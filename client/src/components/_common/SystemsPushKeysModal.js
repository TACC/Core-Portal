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
  Label,
  Input,
  Spinner
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

const SystemsPushKeysModal = () => {
  const dispatch = useDispatch();
  const onOpen = () => {};
  const isOpen = useSelector(state => state.pushKeys.modals.pushKeys);
  const { error, onSuccess, system, submitting } = useSelector(
    state => state.pushKeys.modalProps.pushKeys
  );
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
      type: 'SYSTEMS_TOGGLE_MODAL',
      payload: { operation: 'pushKeys', props: {} }
    });
  };

  const pushKeys = () => {
    const hostnames = system.login
      ? [system.login.host, system.storage.host]
      : system.storage.host;
    [...new Set(hostnames)].forEach(hostname => {
      dispatch({
        type: 'SYSTEMS_PUSH_KEYS',
        payload: {
          systemId: system.id,
          hostname,
          password,
          token,
          type: system.type,
          reloadCallback: reloadPage,
          onSuccess
        }
      });
    });
  };
  return (
    <>
      {isOpen && (
        <Modal
          size="lg"
          isOpen={isOpen}
          onOpened={onOpen}
          onClosed={onClosed}
          toggle={toggle}
        >
          <ModalHeader toggle={toggle}>
            Authenticate with TACC Token
          </ModalHeader>
          {error ? <div style={{ color: 'red' }}>{error.message}</div> : null}
          <ModalBody>
            <p>
              To use this app, you must authenticate to this system with a
              six-digit one time passcode from the TACC Token mobile app at
              least once. A public key will be pushed to your{' '}
              <code>authorized_keys</code> file on the system below. This will
              allow you to submit jobs to this system from this portal.
            </p>
            <Form>
              <FormGroup>
                <Label for="pushKeysSysId">System ID</Label>
                <Input name="pushKeysSysId" disabled value={system.id} />
              </FormGroup>
              <FormGroup>
                <Label for="pushKeysSysType">System Type</Label>
                <Input name="pushKeysSysType" disabled value={system.type} />
              </FormGroup>
              <FormGroup>
                <Label for="pushKeysSysLogin">Login Host</Label>
                <Input
                  name="pushKeysSysLogin"
                  disabled
                  value={system.login.host}
                />
              </FormGroup>
              <FormGroup>
                <Label for="pushKeysSysStorage">Storage Host</Label>
                <Input
                  name="pushKeysSysStorage"
                  disabled
                  value={system.storage.host}
                />
              </FormGroup>
              <FormGroup>
                <Label for="pushKeysPassword">Password</Label>
                <Input
                  name="pushKeysPassword"
                  type="password"
                  autoComplete="tacc-password"
                  onChange={e => setPassword(e.target.value)}
                  value={password}
                />
              </FormGroup>
              <FormGroup>
                <Label for="pushKeysToken">TACC Token</Label>
                <Input
                  name="pushKeysToken"
                  autoComplete="one-time-code"
                  onChange={e => setToken(e.target.value)}
                  value={token}
                />
              </FormGroup>
            </Form>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={pushKeys} disabled={submitting}>
              {submitting && <Spinner size="sm" color="white" />}{' '}
              {error && <FontAwesomeIcon icon={faExclamationCircle} />}{' '}
              Authenticate
            </Button>
            <Button color="secondary" onClick={toggle}>
              Close
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </>
  );
};

export default SystemsPushKeysModal;
