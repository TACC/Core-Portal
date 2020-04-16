import React, { useEffect, useState } from 'react';
import { number, string, func, bool } from 'prop-types';
import {
  Modal,
  ModalHeader as Header,
  ModalBody as Body,
  Table,
  Container,
  Col,
  Row
} from 'reactstrap';
import { useSelector, useDispatch } from 'react-redux';
import { LoadingSpinner } from '_common';
import { chunk, isEmpty, startCase } from 'lodash';

const modalPropTypes = {
  isOpen: bool.isRequired,
  toggle: func.isRequired
};

export const UserRow = ({ username, handleClick, index, active }) => {
  const dispatch = useDispatch();
  const listing = useSelector(
    state => state.allocations.userDirectory[username]
  );
  useEffect(() => {
    if (isEmpty(listing)) {
      dispatch({ type: 'GET_USER_DATA', username });
    }
  }, [dispatch]);
  if (isEmpty(listing)) {
    return <LoadingRow />;
  }
  const { firstName, lastName } = listing;
  return (
    <tr
      className={active ? 'active-user' : ''}
      onClick={() => handleClick(index)}
    >
      <td>
        <span className="user-name">
          {`${startCase(firstName)} ${startCase(lastName)}`}
        </span>
      </td>
    </tr>
  );
};
UserRow.propTypes = {
  username: string.isRequired,
  handleClick: func.isRequired,
  index: number.isRequired,
  active: bool.isRequired
};

const LoadingRow = () => (
  <tr>
    <th>
      <LoadingSpinner placement="inline" />
    </th>
  </tr>
);

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

export const TeamView = ({ isOpen, toggle, pid }) => {
  const [card, setCard] = useState(null);
  const dispatch = useDispatch();
  const { teams, pages } = useSelector(state => state.allocations);
  const loading = useSelector(state => ({
    usernames: state.allocations.loadingUsernames,
    userPage: state.allocations.loadingPage
  }));
  const visible = chunk(teams[pid] || [], 20 * pages[pid]);
  const handleScroll = ({ target }) => {
    const heightDiff = target.scrollHeight - target.scrollTop;
    const bottom =
      heightDiff <= target.clientHeight + 2 &&
      heightDiff >= target.clientHeight - 2;
    if (bottom && visible[0].length < (teams[pid].length || 0)) {
      dispatch({
        type: 'ADD_PAGE',
        payload: {
          [pid]: pages[pid] + 1
        }
      });
    }
  };
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
          <Row>
            <Col className="modal-left" onScroll={handleScroll} lg={5}>
              <Table
                hover={visible.length !== 0}
                responsive
                borderless
                size="sm"
                style={visible ? { height: '250px' } : null}
              >
                <tbody>
                  {visible.length === 0 ? (
                    <tr>
                      <td style={{ verticalAlign: 'middle' }}>
                        <LoadingSpinner />
                      </td>
                    </tr>
                  ) : (
                    (!loading.usernames &&
                      visible[0].map(({ username }, idx) => (
                        <UserRow
                          key={username}
                          username={username}
                          index={idx}
                          handleClick={() => setCard(username)}
                          active={username === card}
                        />
                      ))) || <LoadingRow />
                  )}
                  {loading.userPage && <LoadingRow />}
                </tbody>
              </Table>
            </Col>
            <Col className="modal-right">
              {card ? (
                <ContactCard username={card} />
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

export const ContactCard = ({ username }) => {
  const listing = useSelector(
    state => state.allocations.userDirectory[username]
  );
  if (isEmpty(listing)) return <div />;
  const { firstName, lastName, email } = listing;
  return (
    <div className="contact-card">
      <div>
        <strong>
          {startCase(firstName)} {startCase(lastName)} <br />
        </strong>
      </div>
      <div>Username: {username}</div>
      <div>Email: {email}</div>
    </div>
  );
};
ContactCard.propTypes = { username: string.isRequired };
