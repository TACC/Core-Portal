import React from 'react';
import { Button, Container, Row, Col } from 'reactstrap';
import { useDispatch } from 'react-redux';
import { Link, Route, Switch, useHistory } from 'react-router-dom';
import JobsView from '../Jobs';
import Tickets, { TicketModal, TicketCreateModal } from '../Tickets';
import Sysmon from '../SystemMonitor';
import BrowserChecker from '../_common/BrowserChecker';
import * as ROUTES from '../../constants/routes';
import './Dashboard.scss';

function Dashboard() {
  const dispatch = useDispatch();
  const history = useHistory();

  return (
    <div className="dashboard-wrapper">
      <BrowserChecker />
      <div className="dashboard-header">
        <h5>Dashboard</h5>
        <Link to={`${ROUTES.WORKBENCH}${ROUTES.ACCOUNT}`} className="wb-link">
          <h6>Manage Account</h6>
        </Link>
      </div>
      <Container className="dashboard-items">
        <Row>
          <Col lg="7" className="border-right">
            <div className="jobs-wrapper dash-grid-item">
              <div className="dashboard-item-header">
                <h6>My Recent Jobs</h6>
                <Link to={`${ROUTES.WORKBENCH}${ROUTES.HISTORY}/jobs`}>
                  <Button color="link">
                    <h6>View History</h6>
                  </Button>
                </Link>
              </div>
              <JobsView />
            </div>
          </Col>
          <Col lg="5">
            <div className="sysmon-wrapper dash-grid-item">
              <div className="dashboard-item-header">
                <h6>System Status</h6>
              </div>
              <Sysmon />
            </div>
          </Col>
        </Row>
        <Row>
          <Col lg="7" className="border-right">
            <div className="tickets-wrapper dash-grid-item">
              <div className="dashboard-item-header">
                <h6>My Tickets</h6>
                <Link
                  to={`${ROUTES.WORKBENCH}${ROUTES.DASHBOARD}${ROUTES.TICKETS}/create`}
                >
                  <Button color="link">
                    <h6>Add Ticket</h6>
                  </Button>
                </Link>
              </div>
              <Tickets />
            </div>
          </Col>
        </Row>
      </Container>
      <Switch>
        <Route
          exact
          path={`${ROUTES.WORKBENCH}${ROUTES.DASHBOARD}${ROUTES.TICKETS}/create`}
          render={() => {
            return (
              <TicketCreateModal
                close={() => {
                  history.push(`${ROUTES.WORKBENCH}${ROUTES.DASHBOARD}`);
                }}
                provideDashBoardLinkOnSuccess
              />
            );
          }}
        />
        <Route
          path={`${ROUTES.WORKBENCH}${ROUTES.DASHBOARD}${ROUTES.TICKETS}/:ticketId`}
          render={({ match: { params } }) => {
            dispatch({
              type: 'TICKET_DETAILED_VIEW_OPEN',
              payload: { ticketId: Number(params.ticketId) }
            });
            return <TicketModal />;
          }}
        />
      </Switch>
    </div>
  );
}

export default Dashboard;
