import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import { Modal, ModalHeader } from 'reactstrap';
import TicketCreateForm from './TicketCreateForm';
import * as ROUTES from '../../constants/routes';
import './TicketCreateModal.scss';

function TicketCreateModal() {
  const dispatch = useDispatch();
  const history = useHistory();
  const location = useLocation();
  const authenticatedUser = useSelector(
    (state) => state.authenticatedUser.user
  );
  const {
    modalOpen,
    subject,
    showAsModalOnDashboard,
    provideDashBoardLinkOnSuccess,
  } = useSelector((state) => state.ticketCreateModal);

  useEffect(() => {
    if (
      modalOpen &&
      showAsModalOnDashboard &&
      location.path !==
        `${ROUTES.WORKBENCH}${ROUTES.DASHBOARD}${ROUTES.TICKETS}/create`
    ) {
      history.push(
        `${ROUTES.WORKBENCH}${ROUTES.DASHBOARD}${ROUTES.TICKETS}/create`
      );
    }
  }, [showAsModalOnDashboard, modalOpen]);

  const close = () => {
    dispatch({
      type: 'TICKET_CREATE_CLOSE_MODAL',
    });

    if (showAsModalOnDashboard) {
      history.push(`${ROUTES.WORKBENCH}${ROUTES.DASHBOARD}`);
    }
  };

  return (
    <Modal
      modalClassName="ticket-create-modal"
      isOpen={modalOpen}
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
        initialSubject={subject}
      />
    </Modal>
  );
}
export default TicketCreateModal;
