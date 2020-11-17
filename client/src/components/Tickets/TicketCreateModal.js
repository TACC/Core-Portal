import React from 'react';
import { useSelector } from 'react-redux';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import PropTypes from 'prop-types';
import TicketCreateForm from './TicketCreateForm';
import './TicketCreateModal.scss';

function TicketCreateModal({ isOpen, close, provideDashBoardLinkOnSuccess }) {
  const authenticatedUser = useSelector(state => state.authenticatedUser.user);

  return (
    <Modal
      modalClassName="ticket-create-modal"
      isOpen={isOpen}
      toggle={close}
      size="lg"
      contentClassName="ticket-create-modal-content"
    >
      <ModalHeader toggle={close}>Add Ticket</ModalHeader>
      <ModalBody className="ticket-create-modal-body">
        <TicketCreateForm
          authenticatedUser={authenticatedUser}
          provideDashBoardLinkOnSuccess={provideDashBoardLinkOnSuccess}
        />
      </ModalBody>
    </Modal>
  );
}

TicketCreateModal.propTypes = {
  /** modal is open */
  isOpen: PropTypes.bool,
  /** function to call when modal is closed */
  close: PropTypes.func.isRequired,
  /** provide link to dashboard tickets when creating a ticket */
  provideDashBoardLinkOnSuccess: PropTypes.bool
};

TicketCreateModal.defaultProps = {
  isOpen: true,
  provideDashBoardLinkOnSuccess: false
};

export default TicketCreateModal;
