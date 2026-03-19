import React from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { Button } from '_common';
import { Formik, Form, useFormikContext } from 'formik';
import * as Yup from 'yup';
import FormField from '../Form/FormField';
import InlineMessage from '../InlineMessage';

const SystemsPushKeysModal = () => {
  const dispatch = useDispatch();
  const onOpen = () => {};
  const isOpen = useSelector((state) => state.pushKeys.modals.pushKeys);
  const {
    error,
    onSuccess,
    system,
    submitting,
    onCancel,
    isTACCPortal,
    intitialUsername,
  } = useSelector(
    (state) => ({
      ...state.pushKeys.modalProps.pushKeys,
      isTACCPortal: state.workbench.isTACCPortal,
      intitialUsername: state.authenticatedUser.user.username,
    }),
    shallowEqual
  );

  const isTMSSystem = system?.defaultAuthnMethod === 'TMS_KEYS';

  const history = useHistory();
  const location = useLocation();
  const reloadPage = () => {
    history.push(location.pathname);
  };

  const onClosed = () => {};

  const toggle = () => {
    dispatch({
      type: 'SYSTEMS_TOGGLE_MODAL',
      payload: { operation: 'pushKeys', props: {} },
    });
    if (onCancel) {
      dispatch(onCancel);
    }
  };

  const pushKeys = ({ username, password, token }) => {
    dispatch({
      type: 'SYSTEMS_PUSH_KEYS',
      payload: {
        systemId: system.id,
        hostname: system.host,
        username,
        password,
        token,
        isTMSSystem,
        reloadCallback: reloadPage,
        onSuccess,
      },
    });
  };

  const validationSchema = Yup.object().shape({
    username: Yup.string()
      .min(1)
      .required('Please enter your username for this system.'),
    password: Yup.string().min(1).required('Please enter your password.'),
    token: Yup.string().min(1).required('Please provide a valid MFA token.'),
  });

  const initialValues = {
    username: isTACCPortal ? initialUsername : '',
    password: '',
    token: '',
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
          className="dataFilesModal"
        >
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={pushKeys}
          >
            <Form>
              <ModalHeader toggle={toggle} charCode="&#xe912;">
                Authenticate with {isTACCPortal ? 'TACC' : 'MFA'} Token
              </ModalHeader>
              <ModalBody>
                <p>
                  To proceed, you must authenticate to this system with a
                  six-digit one time passcode from an authentication token app at
                  least once. A public key will be pushed to your{' '}
                  <code>authorized_keys</code> file on the system below. This
                  will allow you to access this system from this portal.{' '}
                </p>
                <FormField
                  name="id"
                  label="System ID"
                  disabled
                  value={system.id}
                />
                <FormField
                  name="host"
                  label="Host"
                  disabled
                  value={system.host}
                />
                <FormField
                  name="username"
                  label="Username"
                  description="Note: This may be different than your username with CILogon. Please verify your username on this system with the institution."
                  required
                  disabled={submitting}
                />
                {!isTMSSystem && (
                  <>
                    <FormField
                      name="password"
                      label="Password"
                      type="password"
                      required
                      disabled={submitting}
                    />
                    <FormField
                      name="token"
                      label={isTACCPortal ? 'TACC Token' : 'MFA Token'}
                      required
                      disabled={submitting}
                      autoComplete="off"
                    />
                  </>
                )}
              </ModalBody>
              <ModalFooter>
                {error && !submitting && (
                  <InlineMessage type="error">{error.message}</InlineMessage>
                )}
                <Button
                  attr="submit"
                  type="primary"
                  disabled={submitting}
                  isLoading={submitting}
                >
                  Authenticate
                </Button>
              </ModalFooter>
            </Form>
          </Formik>
        </Modal>
      )}
    </>
  );
};

export default SystemsPushKeysModal;
