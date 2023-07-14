import React from 'react';
import { Modal, ModalHeader, ModalBody, Alert, Button } from 'reactstrap';
import { bool, func, string } from 'prop-types';

import GoogleDrivePrivacyPolicy from './GoogleDrivePrivacyPolicy';

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
