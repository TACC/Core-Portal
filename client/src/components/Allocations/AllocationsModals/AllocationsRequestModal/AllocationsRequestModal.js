import React from 'react';
import { func, bool } from 'prop-types';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';

export const AllocationsRequestModal = ({ isOpen, toggle }) => (
  <Modal isOpen={isOpen} toggle={() => toggle()}>
    <ModalHeader
      toggle={toggle}
      charCode="x"
      className="allocations-modal-header"
    >
      <span>Manage Allocations</span>
    </ModalHeader>
    <ModalBody className="allocations-request-body" data-testid="request-body">
      <p>
        You can manage your allocation, your team members, or request more time
        on a machine by using your TACC user account credentials to access the
        Resource Allocation System at{' '}
        <a
          href="https://tacc-submit.xras.xsede.org/"
          target="_blank"
          rel="noopener noreferrer"
        >
          https://tacc-submit.xras.xsede.org/
        </a>
        .
      </p>
    </ModalBody>
  </Modal>
);
AllocationsRequestModal.propTypes = {
  isOpen: bool.isRequired,
  toggle: func.isRequired
};

export default AllocationsRequestModal;
