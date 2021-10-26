import React from 'react';
import { Navbar, Alert } from 'reactstrap';
import { useDispatch, useSelector } from 'react-redux';

import BrowserChecker from '../_common/BrowserChecker';
import TicketCreateForm from './TicketCreateForm';
import './TicketStandaloneCreate.scss';

function TicketStandaloneCreate() {
  const dispatch = useDispatch();
  const authenticatedUser = useSelector(state => state.authenticatedUser.user);
  const sitekey = useSelector(state => state.workbench.sitekey);
  const introMessages = useSelector(state => state.introMessages);
  const onDismissIntro = section => {
    const newMessagesState = {
      ...introMessages,
      [section]: false
    };
    dispatch({ type: 'SAVE_INTRO', payload: newMessagesState });
  };
  return (
    <>
      <Navbar className="ticket-unauthenticated-title">Add Ticket</Navbar>

      <div className="ticket-unauthenticated-create-form">
        <Alert
          isOpen={introMessages.TICKETS}
          toggle={() => onDismissIntro('TICKETS')}
          color="secondary"
          className="introMessageGeneral"
        >
          This page allows you to submit a help request via an RT Ticket.
        </Alert>
        <BrowserChecker />
        <TicketCreateForm
          authenticatedUser={authenticatedUser}
          provideDashBoardLinkOnSuccess={false}
          sitekey={sitekey}
        />
      </div>
    </>
  );
}

export default TicketStandaloneCreate;
