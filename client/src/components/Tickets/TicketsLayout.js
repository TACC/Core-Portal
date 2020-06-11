import React, { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Button } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { InfiniteScrollTable } from '_common';
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
  const dispatch = useDispatch();
  const isLoading = useSelector(state => state.ticketList.loading);
  const displayed = useSelector(state => state.ticketList.displayed);
  const tickets = useSelector(state => state.ticketList.content);
  const loadingError = useSelector(state => state.ticketList.loadingError);
  const limit = 20;
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
  useEffect(() => {
    dispatch({ type: 'TICKET_LIST_MORE', params: { offset: 0, limit } });
  }, [dispatch]);

  const infiniteScrollCallback = useCallback(offset => {
    if (offset < tickets.length) {
      dispatch({ type: 'TICKET_LIST_MORE', params: { offset, limit } });
    }
  }, []);

  useEffect(() => {
    dispatch({ type: 'TICKET_LIST_FETCH' });
  }, [dispatch]);

  if (loadingError) {
    return (
      <div className="appDetail-error">
        <FontAwesomeIcon
          icon={faExclamationTriangle}
          style={{ marginRight: '10px' }}
        />
        <div>We were unable to retrieve your tickets!</div>
      </div>
    );
  }

  const columns = [
    {
      Header: 'Ticket Number',
      accessor: 'id',
      Cell: el => <span id={`ticketID${el.index}`}>{el.value}</span>,
      width: 115,
      maxWidth: 115
    },
    {
      Header: 'Subject',
      accessor: 'Subject',
      Cell: el => (
        <Link
          to={`${ROUTES.WORKBENCH}${ROUTES.DASHBOARD}${ROUTES.TICKETS}/${el.row.original.id}`}
        >
          <Button color="link" id={`ticketSubject${el.row.index}`}>
            <span title={el.value}>{el.value}</span>
          </Button>
        </Link>
      )
    },
    {
      Header: 'Date Added',
      headerStyle: { textAlign: 'left' },
      accessor: d => new Date(d.Created),
      Cell: el => (
        <span id={`ticketDate${el.row.index}`}>{`${formatDate(
          el.value
        )}`}</span>
      ),
      id: 'ticketDateCol',
      width: 100
    },
    {
      Header: 'Ticket Status',
      headerStyle: { textAlign: 'left' },
      accessor: d => {
        try {
          return { text: getStatusText(d.Status), unknownStatusText: false };
        } catch {
          return { text: d.Status, unknownStatusText: true };
        }
      },
      Cell: el => (
        <span
          className={el.value.unknownStatusText ? 'ticket-unknown-status' : ''}
        >
          {el.value.text}
        </span>
      ),
      id: 'ticketStatusCol',
      width: 105
    }
  ];

  const rowProps = row => {
    return {
      className:
        row.original.Status === 'user_wait' ? 'ticket-reply-required' : ''
    };
  };

  return (
    <InfiniteScrollTable
      tableColumns={columns}
      tableData={tickets.slice(0, displayed)}
      onInfiniteScroll={infiniteScrollCallback}
      isLoading={isLoading}
      className="tickets-view"
      noDataText={noDataText}
      getRowProps={rowProps}
    />
  );
}

export default TicketsView;
