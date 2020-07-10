import React from 'react';
import { Modal, ModalHeader, ModalBody, Alert } from 'reactstrap';
import { useSelector, useDispatch } from 'react-redux';
import {
  EditRequiredInformationForm,
  ChangePasswordForm,
  EditOptionalInformationForm
} from './ManageAccountForms';

export const EditRequiredInformationModal = () => {
  const { required: open, success, error } = useSelector(({ profile }) => {
    return {
      ...profile.modals,
      success: profile.success.required,
      error: profile.errors.required
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
        charCode="X"
      >
        <span>Edit Required Information</span>
      </ModalHeader>
      <ModalBody
        style={{
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {success && (
          <Alert color="success">
            Successfully Edited Required Information
          </Alert>
        )}
        {error && <Alert color="danger">{error.message}</Alert>}
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
        charCode="X"
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
        charCode="X"
      >
        <span>Change Password</span>
      </ModalHeader>
      <ModalBody>
        {error && <Alert color="danger">{error.message}</Alert>}
        {success && (
          <Alert color="success">
            Your password has been successfully changed!
          </Alert>
        )}
        <ChangePasswordForm />
      </ModalBody>
    </Modal>
  );
};
