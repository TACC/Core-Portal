import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import { Modal, ModalHeader } from 'reactstrap';
import TicketCreateForm from './TicketCreateForm';
import * as ROUTES from '../../constants/routes';
import './TicketCreateModal.scss';

function TicketCreateModal({
  isModalOpen,
  setIsModalOpen,
  initialSubject,
  showAsModalOnDashboard,
  provideDashBoardLinkOnSuccess,
}) {
  const history = useHistory();
  const location = useLocation();
  const authenticatedUser = useSelector(
    (state) => state.authenticatedUser.user
  );

  //const [modalOpen, setModalOpen] = useState(initialOpenState);

  useEffect(() => {
    if (
      isModalOpen &&
      showAsModalOnDashboard &&
      location.path !==
        `${ROUTES.WORKBENCH}${ROUTES.DASHBOARD}${ROUTES.TICKETS}/create`
    ) {
      history.push(
        `${ROUTES.WORKBENCH}${ROUTES.DASHBOARD}${ROUTES.TICKETS}/create`
      );
    }
  }, [showAsModalOnDashboard, isModalOpen]);

  const close = () => {
    setIsModalOpen(false);

    if (showAsModalOnDashboard) {
      history.push(`${ROUTES.WORKBENCH}${ROUTES.DASHBOARD}`);
    }
  };

  return (
    <Modal
      modalClassName="ticket-create-modal"
      isOpen={isModalOpen}
      toggle={close}
      size="lg"
      contentClassName="ticket-create-modal-content"
    >
      <ModalHeader toggle={close} charCode="&#xe912;">
        Add Ticket
      </ModalHeader>
      <TicketCreateForm
        authenticatedUser={authenticatedUser}
        provideDashBoardLinkOnSuccess={provideDashBoardLinkOnSuccess}
        initialSubject={initialSubject}
      />
    </Modal>
  );
}
export default TicketCreateModal;
