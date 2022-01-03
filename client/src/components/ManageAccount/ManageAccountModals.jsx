import React, { useEffect, useRef } from 'react';
import { Modal, ModalHeader, ModalBody, Alert, Button } from 'reactstrap';
import { useSelector, useDispatch } from 'react-redux';
import { bool, func, string } from 'prop-types';
import {
  EditRequiredInformationForm,
  ChangePasswordForm,
  EditOptionalInformationForm,
} from './ManageAccountForms';
import GoogleDrivePrivacyPolicy from './GoogleDrivePrivacyPolicy';

export const EditRequiredInformationModal = () => {
  const {
    required: open,
    success,
    error,
    isEditing,
  } = useSelector(({ profile }) => {
    return {
      ...profile.modals,
      isEditing: profile.editing,
      success: profile.success.required,
      error: profile.errors.required,
    };
  });
  const dispatch = useDispatch();
  const messageRef = useRef(null);
  useEffect(() => {
    if (messageRef.current && !isEditing)
      messageRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [success, error, messageRef, isEditing]);

  const closeModal = () => {
    dispatch({ type: 'CLOSE_PROFILE_MODAL' });
    if (success) dispatch({ type: 'LOAD_PROFILE_DATA' });
  };

  return (
    <Modal isOpen={open} toggle={closeModal} className="manage-account-modal">
      <ModalHeader
        className="manage-account-modal-header"
        toggle={closeModal}
        charCode="&#xe912;"
      >
        <span>Edit Required Information</span>
      </ModalHeader>
      <ModalBody
        style={{
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div ref={messageRef}>
          {success && (
            <Alert color="success">
              Successfully Edited Required Information
            </Alert>
          )}
          {error && <Alert color="danger">{error.message}</Alert>}
        </div>
        <EditRequiredInformationForm />
      </ModalBody>
    </Modal>
  );
};
export const EditOptionalInformationModal = () => {
  const {
    optional: open,
    success,
    error,
  } = useSelector(({ profile }) => {
    return {
      ...profile.modals,
      success: profile.success.optional,
      error: profile.errors.optional,
    };
  });
  const dispatch = useDispatch();
  const closeModal = () => {
    dispatch({ type: 'CLOSE_PROFILE_MODAL' });
    if (success) dispatch({ type: 'LOAD_PROFILE_DATA' });
  };
  return (
    <Modal isOpen={open} toggle={closeModal} className="manage-account-modal">
      <ModalHeader
        className="manage-account-modal-header"
        toggle={closeModal}
        charCode="&#xe912;"
      >
        <span>Edit Optional Information</span>
      </ModalHeader>
      <ModalBody>
        {success && (
          <Alert color="success">
            Successfully Edited Optional Information
          </Alert>
        )}
        {error && (
          <Alert color="danger">Unable to update optional information</Alert>
        )}
        <EditOptionalInformationForm />
      </ModalBody>
    </Modal>
  );
};
export const ChangePasswordModal = () => {
  const {
    password: open,
    error,
    success,
  } = useSelector((state) => {
    return {
      ...state.profile.modals,
      error: state.profile.errors.password,
      success: state.profile.success.password,
    };
  });
  const dispatch = useDispatch();
  const closeModal = () => {
    dispatch({ type: 'CLOSE_PROFILE_MODAL' });
    if (success) dispatch({ type: 'LOAD_PROFILE_DATA' });
  };
  return (
    <Modal isOpen={open} toggle={closeModal} className="manage-account-modal">
      <ModalHeader
        className="manage-account-modal-header"
        toggle={closeModal}
        charCode="&#xe912;"
      >
        <span>Change Password</span>
      </ModalHeader>
      <ModalBody>
        {error && <Alert color="danger">{error.message}</Alert>}
        {success && (
          <Alert color="success">
            Your password has been successfully changed.
          </Alert>
        )}
        <ChangePasswordForm />
      </ModalBody>
    </Modal>
  );
};

export const IntegrationPolicy = ({ label }) => {
  switch (label) {
    case 'Google Drive':
      return <GoogleDrivePrivacyPolicy />;
    default:
      return <></>;
  }
};
IntegrationPolicy.propTypes = {
  label: string.isRequired,
};

export const IntegrationModal = ({ active, toggle, connect, label }) => {
  return (
    <Modal isOpen={active} toggle={toggle} className="manage-account-modal">
      <ModalHeader
        className="manage-account-modal-header"
        toggle={toggle}
        charCode="&#xe912;"
      >
        Connect to {label}
      </ModalHeader>
      <ModalBody>
        <IntegrationPolicy label={label} />
        <div className="container">
          <Button href={connect} className="manage-account-submit-button">
            <span>Agree and Connect to {label}</span>
          </Button>
        </div>
      </ModalBody>
    </Modal>
  );
};
IntegrationModal.propTypes = {
  active: bool.isRequired,
  toggle: func.isRequired,
  connect: string.isRequired,
  label: string.isRequired,
};
