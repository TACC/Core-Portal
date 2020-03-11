import React from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';
import { useSelector, useDispatch } from 'react-redux';
import { RequiredInformationForm } from './ManageAccountForms';

export const EditRequiredInformation = () => {
  const { editRequired: open } = useSelector(state => state.profile.modals);
  const dispatch = useDispatch();
  const closeModal = () => dispatch({ type: 'CLOSE_EDIT_REQUIRED' });
  return (
    <Modal isOpen={open} toggle={closeModal}>
      <ModalHeader>Edit Required Information</ModalHeader>
      <ModalBody
        style={{
          height: '50vh',
          overflowY: 'auto'
        }}
      >
        <RequiredInformationForm />
      </ModalBody>
      <ModalFooter>
        <Button color="primary">Submit</Button>
        <Button color="danger">Close</Button>
      </ModalFooter>
    </Modal>
  );
};
export const EditOptionalInformation = () => {
  const { editOptional: open } = useSelector(state => state.profile.modals);
  const dispatch = useDispatch();
  const closeModal = () => dispatch({ type: 'CLOSE_EDIT_OPTIONAL' });
  return (
    <Modal isOpen={open} toggle={closeModal}>
      <ModalHeader>Edit Optional Information</ModalHeader>
      <ModalBody>Optional Information Form</ModalBody>
    </Modal>
  );
};
export const ChangePassword = () => {
  const { changePW: open } = useSelector(state => state.profile.modals);
  const dispatch = useDispatch();
  const closeModal = () => dispatch({ type: 'CLOSE_CHANGEPW' });
  return (
    <Modal isOpen={open} toggle={closeModal}>
      <ModalHeader>Change Password</ModalHeader>
      <ModalBody>Change Password Form</ModalBody>
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
