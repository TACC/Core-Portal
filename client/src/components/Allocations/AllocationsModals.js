import React, { useState } from 'react';
import { number, string, func, bool, shape, arrayOf, object } from 'prop-types';
import {
  Modal,
  ModalHeader,
  ModalBody,
  Table,
  Container,
  Col,
  Row
} from 'reactstrap';
import { useSelector } from 'react-redux';
import { useTable } from 'react-table';
import { LoadingSpinner } from '_common';
import { capitalize, has, isEmpty } from 'lodash';
import AllocationsUsageTable from './AllocationsUsageTable';

const MODAL_PROPTYPES = {
  isOpen: bool.isRequired,
  toggle: func.isRequired
};
const USER_LISTING_PROPTYPES = shape({
  firstName: string.isRequired,
  lastName: string.isRequired,
  email: string.isRequired,
  username: string.isRequired
});

export const NewAllocReq = ({ isOpen, toggle }) => (
  <Modal isOpen={isOpen} toggle={() => toggle()}>
    <ModalHeader
      toggle={toggle}
      charCode="x"
      className="allocations-modal-header"
    >
      <span>Manage Allocations</span>
    </ModalHeader>
    <ModalBody className="allocations-request-body" data-testid="request-body">
      <p>
        You can manage your allocation, your team members, or request more time
        on a machine by using your TACC user account credentials to access the
        Resource Allocation System at{' '}
        <a
          href="https://tacc-submit.xras.xsede.org/"
          target="_blank"
          rel="noopener noreferrer"
        >
          https://tacc-submit.xras.xsede.org/
        </a>
        .
      </p>
    </ModalBody>
  </Modal>
);
NewAllocReq.propTypes = MODAL_PROPTYPES;

const UserCell = ({ cell: { value } }) => {
  const { firstName, lastName } = value;
  return (
    <span className="user-name">
      {`${capitalize(firstName)} ${capitalize(lastName)}`}
    </span>
  );
};
UserCell.propTypes = {
  cell: shape({
    value: shape({
      firstName: string.isRequired,
      lastName: string.isRequired
    }).isRequired
  }).isRequired
};

const TeamTable = ({ rawData, clickHandler, visible }) => {
  const data = React.useMemo(() => rawData, [rawData]);
  const columns = React.useMemo(
    () => [
      {
        Header: 'name',
        accessor: row => row,
        UserCell
      }
    ],
    [rawData]
  );
  const { getTableProps, getTableBodyProps, rows, prepareRow } = useTable({
    columns,
    data
  });
  return (
    <Table hover responsive borderless size="sm" {...getTableProps()}>
      <tbody {...getTableBodyProps()}>
        {rows.map(row => {
          prepareRow(row);
          return (
            <tr
              {...row.getRowProps({
                className: row.values.name === visible ? 'active-user' : '',
                onClick: () => {
                  clickHandler(row.values.name);
                }
              })}
            >
              {row.cells.map(cell => (
                <td {...cell.getCellProps()}>{cell.render('UserCell')}</td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
};
TeamTable.propTypes = {
  rawData: arrayOf(object),
  clickHandler: func.isRequired,
  visible: USER_LISTING_PROPTYPES
};
TeamTable.defaultProps = { visible: {}, rawData: [] };

export const TeamView = ({ isOpen, toggle, pid }) => {
  const { teams, loadingUsernames, errors } = useSelector(
    state => state.allocations
  );
  const error = has(errors.teams, pid);
  const [card, setCard] = useState(null);
  const isLoading = loadingUsernames[pid] && loadingUsernames[pid].loading;
  return (
    <Modal
      isOpen={isOpen}
      toggle={toggle}
      className="team-view-modal-wrapper"
      size="lg"
    >
      <ModalHeader
        toggle={toggle}
        charCode="x"
        className="allocations-modal-header"
      >
        <span>View Team</span>
      </ModalHeader>
      <ModalBody className="d-flex p-0">
        <Container>
          {error ? (
            <Row style={{ height: '50vh' }}>
              <Col className="d-flex justify-content-center">
                <span>Unable to retrieve team data.</span>
              </Col>
            </Row>
          ) : (
            <Row>
              <Col className="modal-left" lg={5}>
                {isLoading ? (
                  <LoadingSpinner />
                ) : (
                  <TeamTable
                    visible={card}
                    rawData={teams[pid]}
                    clickHandler={setCard}
                  />
                )}
              </Col>
              <Col className="modal-right">
                {isLoading ? (
                  <span>Loading user list. This may take a moment.</span>
                ) : (
                  <ContactCard listing={card} />
                )}
              </Col>
            </Row>
          )}
        </Container>
      </ModalBody>
    </Modal>
  );
};
TeamView.propTypes = { ...MODAL_PROPTYPES, pid: number.isRequired };

export const ContactCard = ({ listing }) => {
  if (!listing)
    return (
      <span>Click on a user’s name to view their contact information.</span>
    );
  const { firstName, lastName, email, username } = listing;
  return (
    <div className="contact-card">
      <div className="contact-card-item">
        <strong>
          {capitalize(firstName)} {capitalize(lastName)} <br />
        </strong>
      </div>
      <div className="contact-card-item">
        Username: {username} | Email: {email}
      </div>
      {!isEmpty(listing.usageData) && (
        <AllocationsUsageTable rawData={listing.usageData} />
      )}
    </div>
  );
};

ContactCard.propTypes = { listing: USER_LISTING_PROPTYPES };
ContactCard.defaultProps = { listing: {} };
