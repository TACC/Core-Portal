import React from 'react';
import { number, string, func, bool } from 'prop-types';
import {
  Modal,
  ModalHeader as Header,
  ModalBody as Body,
  Table,
  Button,
  Container,
  Col,
  Row
} from 'reactstrap';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { chunk, isEmpty, startCase } from 'lodash';

const modalPropTypes = {
  isOpen: bool.isRequired,
  toggle: func.isRequired
};

export const UserRow = ({ username, handleClick, index }) => {
  const dispatch = useDispatch();
  const listing = useSelector(
    state => state.allocations.userDirectory[username]
  );
  React.useEffect(() => {
    if (isEmpty(listing)) {
      dispatch({ type: 'GET_USER_DATA', username });
    }
  }, [dispatch]);
  if (isEmpty(listing)) {
    return <tr />;
  }
  const { firstName, lastName } = listing;
  return (
    <tr>
      <td>
        <Button
          onClick={() => handleClick(index)}
          className="btn btn-sm"
          color="link"
        >
          <span className="user-name">
            {`${startCase(firstName)} ${startCase(lastName)}`}
          </span>
        </Button>
      </td>
    </tr>
  );
};
UserRow.propTypes = {
  username: string.isRequired,
  handleClick: func.isRequired,
  index: number.isRequired
};

export const NewAllocReq = ({ isOpen, toggle }) => (
  <Modal isOpen={isOpen} toggle={() => toggle()}>
    <Header toggle={toggle} charCode="x" className="allocations-modal-header">
      <span>Request New Allocation</span>
    </Header>
    <Body className="allocations-request-body" data-testid="request-body">
      To request a new allocation, please submit a ticket{' '}
      <Link to="/workbench/dashboard">here</Link>.
    </Body>
  </Modal>
);
NewAllocReq.propTypes = modalPropTypes;

export const TeamView = ({ isOpen, toggle, pid }) => {
  const [card, setCard] = React.useState(null);
  const dispatch = useDispatch();
  const teams = useSelector(state => state.allocations.teams);
  const pages = useSelector(state => state.allocations.pages);
  const loading = useSelector(state => state.allocations.loadingUsernames);
  if (loading) return <div />;
  const visible = chunk(teams[pid] || [], 20 * pages[pid]);
  const handleScroll = ({ target }) => {
    const bottom =
      target.scrollHeight - target.scrollTop === target.clientHeight;
    if (bottom) {
      dispatch({
        type: 'ADD_PAGE',
        payload: {
          [pid]: pages[pid] + 1
        }
      });
    }
  };
  if (visible.length === 0) return <div />;
  return (
    <Modal isOpen={isOpen} toggle={toggle} className="team-view-modal-wrapper">
      <Header toggle={toggle} charCode="x" className="allocations-modal-header">
        <span>View Team</span>
      </Header>
      <Body className="d-flex p-0">
        <Container>
          <Row>
            <Col className="modal-left" onScroll={handleScroll} lg={5}>
              <Table hover responsive borderless size="sm">
                <tbody>
                  {visible[0].map(({ username }, idx) => (
                    <UserRow
                      key={username}
                      username={username}
                      index={idx}
                      handleClick={() => setCard(username)}
                    />
                  ))}
                </tbody>
              </Table>
            </Col>
            <Col className="modal-right">
              {card ? (
                <ContactCard username={card} />
              ) : (
                "Click on a user's name to view their contact information and usage."
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
      <strong>
        {startCase(firstName)} {startCase(lastName)} <br />
      </strong>
      <div>Username: {username}</div>
      <div>Email: {email}</div>
    </div>
  );
};
ContactCard.propTypes = { username: string.isRequired };
