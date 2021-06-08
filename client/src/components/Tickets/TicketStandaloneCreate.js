import React from 'react';
import { Navbar, Alert } from 'reactstrap';
import { useDispatch, useSelector } from 'react-redux';

import BrowserChecker from '../_common/BrowserChecker';
import TicketCreateForm from './TicketCreateForm';
import './TicketStandaloneCreate.scss';

function TicketStandaloneCreate() {
  const dispatch = useDispatch();
  const authenticatedUser = useSelector(state => state.authenticatedUser.user);
  const welcomeMessages = useSelector(state => state.welcomeMessages);
  const onDismissWelcome = section => {
    const newMessagesState = {
      ...welcomeMessages,
      [section]: false
    };
    dispatch({ type: 'SAVE_WELCOME', payload: newMessagesState });
  };
  return (
    <>
      <Navbar className="ticket-unauthenticated-title">Add Ticket</Navbar>

      <div className="ticket-unauthenticated-create-form">
        <Alert
          isOpen={welcomeMessages.TICKETS}
          toggle={() => onDismissWelcome('TICKETS')}
          color="secondary"
          className="welcomeMessageGeneral"
        >
          This page allows you to submit a help request via an RT Ticket.
        </Alert>
        <BrowserChecker />
        <TicketCreateForm
          authenticatedUser={authenticatedUser}
          provideDashBoardLinkOnSuccess={false}
        />
      </div>
    </>
  );
}

export default TicketStandaloneCreate;
