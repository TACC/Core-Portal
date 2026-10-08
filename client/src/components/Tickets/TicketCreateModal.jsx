import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { Modal, ModalHeader } from 'reactstrap';
import TicketCreateForm from './TicketCreateForm';
import * as ROUTES from '../../constants/routes';
import './TicketCreateModal.scss';
import { useAuthenticatedUser } from '@tacc/core-hooks';

function TicketCreateModal({
  isModalOpen,
  setIsModalOpen,
  initialSubject,
  showAsModalOnDashboard,
  provideDashBoardLinkOnSuccess,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const authenticatedUser = useAuthenticatedUser();

  useEffect(() => {
    if (
      isModalOpen &&
      showAsModalOnDashboard &&
      location.path !==
        `${ROUTES.WORKBENCH}${ROUTES.DASHBOARD}${ROUTES.TICKETS}/create`
    ) {
      navigate(
        `${ROUTES.WORKBENCH}${ROUTES.DASHBOARD}${ROUTES.TICKETS}/create`
      );
    }
  }, [showAsModalOnDashboard, isModalOpen]);

  const close = () => {
    setIsModalOpen(false);

    if (showAsModalOnDashboard) {
      navigate(`${ROUTES.WORKBENCH}${ROUTES.DASHBOARD}`);
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
