import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { InfiniteScrollTable, Message } from '_common';
import { ticketsQueries } from '@tacc/core-queries';
import { formatDate } from 'utils/timeFormat';
import * as ROUTES from '../../constants/routes';
import './TicketsLayout.scss';

export function getStatusText(status) {
  switch (status) {
    case 'new':
      return 'New';
    case 'closed':
    case 'resolved':
      return 'Resolved';
    case 'open':
      return 'In Progress';
    case 'user_wait':
      return 'Reply Required';
    case 'internal_wait':
      return 'Reply Sent';
    default:
      throw new RangeError('no defined text for this status');
  }
}

function TicketsView() {
  const {
    data: ticketsData,
    isLoading,
    isError,
  } = useQuery(ticketsQueries.listTickets());
  const noDataText = (
    <>
      No tickets. You can add a ticket{' '}
      <Link
        className="wb-link"
        to={`${ROUTES.WORKBENCH}${ROUTES.DASHBOARD}${ROUTES.TICKETS}/create/`}
      >
        here
      </Link>
      .
    </>
  );

  if (isError) {
    return (
      <Message type="warn" className="ticket__error">
        We were unable to retrieve your tickets.
      </Message>
    );
  }

  const columns = [
    {
      Header: 'Number',
      accessor: 'id',
      Cell: (el) => <span id={`ticketID${el.index}`}>{el.value}</span>,
    },
    {
      Header: 'Subject',
      accessor: 'Subject',
      Cell: (el) => (
        <Link
          to={`${ROUTES.WORKBENCH}${ROUTES.DASHBOARD}${ROUTES.TICKETS}/${el.row.original.id}`}
          className="wb-link"
        >
          <span title={el.value}>{el.value}</span>
        </Link>
      ),
    },
    {
      Header: 'Date Added',
      headerStyle: { textAlign: 'left' },
      accessor: (d) => new Date(d.Created),
      Cell: (el) => (
        <span id={`ticketDate${el.row.index}`}>{`${formatDate(
          el.value
        )}`}</span>
      ),
      id: 'ticketDateCol',
    },
    {
      Header: 'Ticket Status',
      headerStyle: { textAlign: 'left' },
      accessor: (d) => {
        try {
          return { text: getStatusText(d.Status), unknownStatusText: false };
        } catch {
          return { text: d.Status, unknownStatusText: true };
        }
      },
      Cell: (el) => (
        <span
          className={el.value.unknownStatusText ? 'ticket-unknown-status' : ''}
        >
          {el.value.text}
        </span>
      ),
      id: 'ticketStatusCol',
    },
  ];

  const rowProps = (row) => {
    return {
      className:
        row.original.Status === 'user_wait' ? 'ticket-reply-required' : '',
    };
  };

  return (
    <InfiniteScrollTable
      tableColumns={columns}
      tableData={ticketsData ?? []}
      isLoading={isLoading}
      className="tickets-view"
      noDataText={noDataText}
      getRowProps={rowProps}
    />
  );
}

export default TicketsView;
