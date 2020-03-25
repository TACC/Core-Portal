import React from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import TicketCreateForm from './TicketCreateForm';
import './TicketCreateModal.scss';
import * as ROUTES from '../../constants/routes';

function TicketCreateModal() {
  const modalAlwaysOpen = true;
  const authenticatedUser = useSelector(state => state.authenticatedUser.user);
  const history = useHistory();
  const close = () => {
    history.push(`${ROUTES.WORKBENCH}${ROUTES.DASHBOARD}`);
  };

  return (
    <Modal
      className="ticket-create-model-content"
      isOpen={modalAlwaysOpen}
      toggle={close}
      size="lg"
    >
      <ModalHeader toggle={close}>Add Ticket</ModalHeader>
      <ModalBody className="ticket-create-modal-body">
        <TicketCreateForm authenticatedUser={authenticatedUser} />
      </ModalBody>
    </Modal>
  );
}

export default TicketCreateModal;
