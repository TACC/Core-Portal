import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Button } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import ReactTable from 'react-table-6';
import 'react-table-6/react-table.css';
import { LoadingSpinner } from '_common';
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
  const loading = useSelector(state => state.ticketList.loading);
  const tickets = useSelector(state => state.ticketList.content);
  const loadingError = useSelector(state => state.ticketList.loadingError);

  useEffect(() => {
    dispatch({ type: 'TICKET_LIST_FETCH' });
  }, [dispatch]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (loadingError) {
    return (
      <div className="ticket__error">
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
          to={`${ROUTES.WORKBENCH}${ROUTES.DASHBOARD}${ROUTES.TICKETS}/${el.original.id}`}
        >
          <Button color="link" id={`ticketSubject${el.index}`}>
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
        <span id={`ticketDate${el.index}`}>{`${formatDate(el.value)}`}</span>
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

  return (
    <>
      <ReactTable
        keyField="id"
        data={tickets}
        columns={columns}
        resizable={false}
        resolveData={data => data.map(row => row)}
        pageSize={tickets.length}
        showPagination={false}
        className="ticketsList -striped -highlight"
        defaultSorted={[{ id: 'ticketDateCol', desc: true }]}
        getTrProps={(state, rowInfo, instance) => {
          if (rowInfo) {
            return {
              className:
                rowInfo.original.Status === 'user_wait'
                  ? 'ticket-reply-required'
                  : ''
            };
          }
          return {};
        }}
        noDataText={
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
        }
      />
    </>
  );
}

export default TicketsView;
