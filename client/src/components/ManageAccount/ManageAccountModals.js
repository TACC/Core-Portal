import React from 'react';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import { useSelector, useDispatch } from 'react-redux';
import {
  EditRequiredInformationForm,
  ChangePasswordForm,
  EditOptionalInformationForm
} from './ManageAccountForms';

export const EditRequiredInformation = () => {
  const { editRequired: open } = useSelector(state => state.profile.modals);
  const dispatch = useDispatch();
  const closeModal = () => dispatch({ type: 'CLOSE_EDIT_REQUIRED' });
  return (
    <Modal isOpen={open} toggle={closeModal}>
      <ModalHeader className="manage-account-modal-header">
        Edit Required Information
      </ModalHeader>
      <ModalBody
        style={{
          maxHeight: '50vh',
          overflowY: 'auto'
        }}
      >
        <EditRequiredInformationForm />
      </ModalBody>
    </Modal>
  );
};
export const EditOptionalInformation = () => {
  const { editOptional: open } = useSelector(state => state.profile.modals);
  const dispatch = useDispatch();
  const closeModal = () => dispatch({ type: 'CLOSE_EDIT_OPTIONAL' });
  return (
    <Modal isOpen={open} toggle={closeModal}>
      <ModalHeader className="manage-account-modal-header">
        Edit Optional Information
      </ModalHeader>
      <ModalBody>
        <EditOptionalInformationForm />
      </ModalBody>
    </Modal>
  );
};
export const ChangePassword = () => {
  const { changePW: open } = useSelector(state => state.profile.modals);
  const dispatch = useDispatch();
  const closeModal = () => dispatch({ type: 'CLOSE_CHANGEPW' });
  return (
    <Modal isOpen={open} toggle={closeModal}>
      <ModalHeader className="manage-account-modal-header">
        Change Password
      </ModalHeader>
      <ModalBody>
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
