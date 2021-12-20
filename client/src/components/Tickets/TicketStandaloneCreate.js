import React from 'react';
import { Navbar, Alert } from 'reactstrap';
import { useSelector } from 'react-redux';

import BrowserChecker from '../_common/BrowserChecker';
import TicketCreateForm from './TicketCreateForm';
import './TicketStandaloneCreate.scss';

function TicketStandaloneCreate() {
  const authenticatedUser = useSelector(state => state.authenticatedUser.user);
  const introMessages = useSelector(state => state.introMessages);
  return (
    <>
      <Navbar className="ticket-unauthenticated-title">Add Ticket</Navbar>

      <div className="ticket-unauthenticated-create-form">
        <Alert
          isOpen={introMessages.TICKETS}
          color="secondary"
          className="introMessageGeneral"
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
