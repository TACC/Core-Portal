import React, {useState} from 'react';
import {Table, NavLink} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun } from '@fortawesome/free-solid-svg-icons'
import useFetch from '../../utils/useFetch';
import './tickets.css'

function TicketList() {
  const res = useFetch(`/api/tickets/`, {});

  if (!res.response) {
    return (
      <div id='spin-sun'>
        <FontAwesomeIcon icon={faSun} size="8x" spin />
      </div>
    )
  }

  return (
    <div>
      <Table>
        <thead>
        <tr>
          <th>Ticket Number</th>
          <th>Subject</th>
          <th>Date Submitted</th>
          <th>Status</th>
        </tr>
        </thead>
        <tbody>
        {res && res.response.map((el) => (
          <tr key={el.id}>
            <th scope="row" id={el.id}>{el.id}</th>
            <td> <NavLink href="#">{el.Subject}</NavLink></td>
            <td>{el.Created}</td>
            <td>{el.Status}</td>
          </tr>
        ))}
        </tbody>
      </Table>
    </div>
  );
}

function Tickets() {

  return (
    <div>
      <b>Tickets</b> <NavLink href="#" className='float-right'>Add Ticket</NavLink>
      <TicketList id="tickets"/>
    </div>
  );
}
export default Tickets;
