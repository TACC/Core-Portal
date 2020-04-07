import React from 'react';
import { Modal, ModalHeader, ModalBody, UncontrolledAlert } from 'reactstrap';
import { useSelector, useDispatch } from 'react-redux';
import {
  EditRequiredInformationForm,
  ChangePasswordForm,
  EditOptionalInformationForm
} from './ManageAccountForms';

export const EditRequiredInformation = () => {
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
    if (success) dispatch({ type: 'LOAD_DATA' });
  };
  return (
    <Modal isOpen={open} toggle={closeModal} className="manage-account-modal">
      <ModalHeader className="manage-account-modal-header">
        Edit Required Information
      </ModalHeader>
      <ModalBody
        style={{
          maxHeight: '50vh',
          overflowY: 'auto'
        }}
      >
        {success && (
          <UncontrolledAlert color="success">
            Successfully Edited Required Information
          </UncontrolledAlert>
        )}
        {error && (
          <UncontrolledAlert color="danger">{error.message}</UncontrolledAlert>
        )}
        <EditRequiredInformationForm />
      </ModalBody>
    </Modal>
  );
};
export const EditOptionalInformation = () => {
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
    if (success) dispatch({ type: 'LOAD_DATA' });
  };
  return (
    <Modal isOpen={open} toggle={closeModal} className="manage-account-modal">
      <ModalHeader className="manage-account-modal-header">
        Edit Optional Information
      </ModalHeader>
      <ModalBody>
        {success && (
          <UncontrolledAlert color="success">
            Successfully Edited Optional Information
          </UncontrolledAlert>
        )}
        {error && (
          <UncontrolledAlert color="danger">
            Unable to update optional information
          </UncontrolledAlert>
        )}
        <EditOptionalInformationForm />
      </ModalBody>
    </Modal>
  );
};
export const ChangePassword = () => {
  const { password: open, error, success } = useSelector(({ profile }) => {
    return {
      ...profile.modals,
      error: profile.errors.password,
      success: profile.success.password
    };
  });
  const dispatch = useDispatch();
  const closeModal = () => dispatch({ type: 'CLOSE_PROFILE_MODAL' });
  return (
    <Modal isOpen={open} toggle={closeModal} className="manage-account-modal">
      <ModalHeader className="manage-account-modal-header">
        Change Password
      </ModalHeader>
      <ModalBody>
        {error && (
          <UncontrolledAlert color="danger">{error.message}</UncontrolledAlert>
        )}
        {success && (
          <UncontrolledAlert color="success">
            Your password has been successfully changed!
          </UncontrolledAlert>
        )}
        <ChangePasswordForm />
      </ModalBody>
    </Modal>
  );
};

export default () => {
  return (
    <>
      <EditRequiredInformation />
      <EditOptionalInformation />
      <ChangePassword />
    </>
  );
};
