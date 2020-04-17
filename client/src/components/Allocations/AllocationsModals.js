import React, { useState } from 'react';
import { number, string, func, bool, shape, arrayOf, object } from 'prop-types';
import {
  Modal,
  ModalHeader as Header,
  ModalBody as Body,
  Table,
  Container,
  Col,
  Row
} from 'reactstrap';
import { useSelector } from 'react-redux';
import { useTable } from 'react-table';
import { LoadingSpinner } from '_common';
import { isEmpty, capitalize } from 'lodash';

const modalPropTypes = {
  isOpen: bool.isRequired,
  toggle: func.isRequired
};

export const NewAllocReq = ({ isOpen, toggle }) => (
  <Modal isOpen={isOpen} toggle={() => toggle()}>
    <Header toggle={toggle} charCode="x" className="allocations-modal-header">
      <span>Manage Allocations</span>
    </Header>
    <Body className="allocations-request-body" data-testid="request-body">
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
    </Body>
  </Modal>
);
NewAllocReq.propTypes = modalPropTypes;

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

const TeamTable = ({ rawData, clickHandler }) => {
  const data = React.useMemo(() => rawData, [rawData]);
  const columns = React.useMemo(
    () => [
      {
        Header: 'name',
        accessor: row => {
          return row;
        },
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
                onClick: () => clickHandler(row.values.name)
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
  rawData: arrayOf(object).isRequired,
  clickHandler: func.isRequired
};

export const TeamView = ({ isOpen, toggle, pid }) => {
  const { teams, loadingUsernames } = useSelector(state => state.allocations);
  const [card, setCard] = useState(null);

  return (
    <Modal
      isOpen={isOpen}
      toggle={toggle}
      className="team-view-modal-wrapper"
      size="lg"
    >
      <Header toggle={toggle} charCode="x" className="allocations-modal-header">
        <span>View Team</span>
      </Header>
      <Body className="d-flex p-0">
        <Container>
          <Row />
          <Row>
            <Col className="modal-left" lg={5}>
              {loadingUsernames[pid] && loadingUsernames[pid].loading ? (
                <LoadingSpinner />
              ) : (
                !isEmpty(teams[pid]) && (
                  <TeamTable rawData={teams[pid]} clickHandler={setCard} />
                )
              )}
            </Col>
            <Col className="modal-right">
              {card ? (
                <ContactCard listing={card} />
              ) : (
                "Click on a user's name to view their contact information."
              )}
            </Col>
          </Row>
        </Container>
      </Body>
    </Modal>
  );
};
TeamView.propTypes = { ...modalPropTypes, pid: number.isRequired };

export const ContactCard = ({ listing }) => {
  const { firstName, lastName, email, username } = listing;
  return (
    <div className="contact-card">
      <div>
        <strong>
          {capitalize(firstName)} {capitalize(lastName)} <br />
        </strong>
      </div>
      <div>Username: {username}</div>
      <div>Email: {email}</div>
    </div>
  );
};
ContactCard.propTypes = {
  listing: shape({
    firstName: string.isRequired,
    lastName: string.isRequired,
    email: string.isRequired,
    username: string.isRequired
  }).isRequired
};
