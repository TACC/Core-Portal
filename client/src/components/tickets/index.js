import React from 'react';
import { Button } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun } from '@fortawesome/free-solid-svg-icons'
import ReactTable from 'react-table';
import 'react-table/react-table.css';
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

  const columns = [
    {
      Header: 'Ticket Number',
      accessor: 'id',
      Cell: el => <span id={`ticketID${el.index}`}>{el.value}</span>,
      maxWidth: 125
    },
    {
      Header: 'Subject',
      accessor: 'Subject',
      Cell: el => (
        <Button color="link" id={`ticketSubject${el.index}`}>
          <span title={el.value}>{el.value}</span>
        </Button>
      )
    },
    {
      Header: 'Date Added',
      headerStyle: { textAlign: 'left' },
      accessor: d => new Date(d.Created),
      Cell: el => (
        <span id={`ticketDate${el.index}`}>
          {`${el.value.getMonth() +
            1}/${el.value.getDate()}/${el.value.getFullYear()}`}
        </span>
      ),
      id: 'ticketDateCol',
      width: 100
    },
    {
      Header: 'Ticket Status',
      headerStyle: { textAlign: 'left' },
      accessor: d =>
        d.Status.substr(0, 1).toUpperCase() + d.Status.substr(1).toLowerCase(),
      id: 'ticketStatusCol',
      width: 100
    }
  ];

  return (
    <ReactTable
      keyField="id"
      data={res.response}
      columns={columns}
      resolveData={data => data.map(row => row)}
      pageSize={res.response.length}
      className="ticketsList -striped -highlight"
      defaultSorted={[{ id: 'id' }]}
      noDataText={
        <>
          No tickets. You can create tickets from the{' '}
          <a className="wb-link" href="/tickets">
            Tickets Page
          </a>
          .
        </>
      }
    />
  );
}

export default TicketList;
