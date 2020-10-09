import React from 'react';
import { Button, Row, Col } from 'reactstrap';
import { useDispatch } from 'react-redux';
import { Link, Route, Switch } from 'react-router-dom';

import { BrowserChecker, Section } from '_common';
import JobsView from '../Jobs';
import Tickets, { TicketModal, TicketCreateModal } from '../Tickets';
import Sysmon from '../SystemMonitor';
import * as ROUTES from '../../constants/routes';
import './Dashboard.scss';

function Dashboard() {
  const dispatch = useDispatch();

  return (
    <Section
      messages={<BrowserChecker />}
      header="Dashboard"
      headerClassName="dashboard-header"
      actions={
        <Link to="/accounts/profile" className="wb-link">
          Manage Account
        </Link>
      }
      content={
        <>
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
        </>
      }
      contentClassName="dashboard-items container"
      contentShouldScroll
      externals={
        <Switch>
          <Route
            exact
            path={`${ROUTES.WORKBENCH}${ROUTES.DASHBOARD}${ROUTES.TICKETS}/create`}
            render={() => {
              dispatch({
                type: 'TICKETS_CREATE_INIT'
              });
              return <TicketCreateModal />;
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
      }
    />
  );
}

export default Dashboard;
