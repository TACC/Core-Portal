import React, { useEffect, useRef } from 'react';
import { Modal, ModalHeader, ModalBody, Alert, Button } from 'reactstrap';
import { useSelector, useDispatch } from 'react-redux';
import { bool, func } from 'prop-types';
import {
  EditRequiredInformationForm,
  ChangePasswordForm,
  EditOptionalInformationForm
} from './ManageAccountForms';

export const EditRequiredInformationModal = () => {
  const { required: open, success, error, isEditing } = useSelector(
    ({ profile }) => {
      return {
        ...profile.modals,
        isEditing: profile.editing,
        success: profile.success.required,
        error: profile.errors.required
      };
    }
  );
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
          overflowY: 'auto'
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
  const { optional: open, success, error } = useSelector(({ profile }) => {
    return {
      ...profile.modals,
      success: profile.success.optional,
      error: profile.errors.optional
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
  const { password: open, error, success } = useSelector(state => {
    return {
      ...state.profile.modals,
      error: state.profile.errors.password,
      success: state.profile.success.password
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

export const GoogleDriveModal = ({ active, toggle }) => {
  return (
    <Modal isOpen={active} toggle={toggle} className="manage-account-modal">
      <ModalHeader
        className="manage-account-modal-header"
        toggle={toggle}
        charCode="&#xe912;"
      >
        Connect to Google Drive
      </ModalHeader>
      <ModalBody>
        <div className="container">
          <h2>Google Drive Privacy Policy</h2>

          <p>
            By connecting your Google Drive account, you consent to giving this
            portal <strong>read</strong> and <strong>write</strong> access to
            your Google Drive account. This portal makes a secure connection to
            your Google Drive account to list your data in the Data Depot, and
            to copy data to and from TACC&lsquo;s data servers.
          </p>
          <p>
            We request this level of scope access (as opposed to read-only) to
            give you the best user experience, allowing you to upload field data
            and simulation results directly to your Google Drive, while also
            viewing and using these files in experimental workflows by copying
            data from Google Drive to a directory you own in the Data Depot.
          </p>
          <p>
            <strong>
              We do not store any personal or identifying information from your
              Google Drive account
            </strong>
            , other than an access token and related file metadata, which is
            limited to mimeType, name, id, modifiedTime, fileExtension, size,
            and parents.
          </p>
          <Button
            href="/accounts/applications/googledrive/initialize/"
            className="manage-account-submit-button"
          >
            <span>Agree and Connect to Google Drive</span>
          </Button>
        </div>
      </ModalBody>
    </Modal>
  );
};
GoogleDriveModal.propTypes = {
  active: bool.isRequired,
  toggle: func.isRequired
};
