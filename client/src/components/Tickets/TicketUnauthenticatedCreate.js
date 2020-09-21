import React, { useEffect } from 'react';
import { Navbar } from 'reactstrap';
import { useDispatch, useSelector } from 'react-redux';

import BrowserChecker from '../_common/BrowserChecker';
import TicketCreateForm from './TicketCreateForm';
import './TicketUnauthenticatedCreate.scss';

function TicketUnauthenticatedCreate() {
  const dispatch = useDispatch();
  const authenticatedUser = useSelector(state => state.authenticatedUser.user);
  useEffect(() => {
    dispatch({ type: 'FETCH_AUTHENTICATED_USER' });
  }, []);
  return (
    <>
      <Navbar className="ticket-unauthenticated-title">Add Ticket</Navbar>

      <div className="ticket-unauthenticated-create-form">
        <BrowserChecker />
        <TicketCreateForm authenticatedUser={authenticatedUser} />
      </div>
    </>
  );
}

export default TicketUnauthenticatedCreate;
