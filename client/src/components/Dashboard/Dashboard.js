import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, Route, Switch } from 'react-router-dom';

import { BrowserChecker, Section, SectionTableWrapper } from '_common';
import JobsView from '../Jobs';
import Tickets, { TicketModal } from '../Tickets';
import Sysmon from '../SystemMonitor';
import * as ROUTES from '../../constants/routes';
import './Dashboard.global.css';
import './Dashboard.module.css';

function Dashboard() {
  const showApps = useSelector(state => state.workbench.config.showApps);
  return (
    <Section
      bodyClassName="has-loaded-dashboard"
      welcomeMessageName="DASHBOARD"
      messages={<BrowserChecker />}
      header="Dashboard"
      headerActions={
        <Link to={`${ROUTES.WORKBENCH}${ROUTES.ACCOUNT}`} className="wb-link">
          Manage Account
        </Link>
      }
      contentStyleName="panels"
      contentLayoutName="twoColumnUnequal"
      contentShouldScroll
      content={
        <>
          {showApps && <DashboardJobs />}
          <DashboardTickets />
          <DashboardSysmon />
          <DashboardRoutes />
        </>
      }
    />
  );
}

function DashboardRoutes() {
  const dispatch = useDispatch();

  return (
    <Switch>
      <Route
        exact
        path={`${ROUTES.WORKBENCH}${ROUTES.DASHBOARD}${ROUTES.TICKETS}/create`}
        render={() => {
          dispatch({
            type: 'TICKET_CREATE_OPEN_MODAL'
          });
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
  );
}

function DashboardSysmon() {
  return (
    <SectionTableWrapper
      header="System Status"
      styleName="sysmon-panel"
      contentShouldScroll
    >
      <Sysmon />
    </SectionTableWrapper>
  );
}

function DashboardJobs() {
  return (
    <SectionTableWrapper
      header="My Recent Jobs"
      headerActions={
        <Link
          to={`${ROUTES.WORKBENCH}${ROUTES.HISTORY}/jobs`}
          className="wb-link"
        >
          View History
        </Link>
      }
      contentShouldScroll
    >
      <JobsView />
    </SectionTableWrapper>
  );
}

function DashboardTickets() {
  return (
    <SectionTableWrapper
      header="My Tickets"
      headerActions={
        <Link
          to={`${ROUTES.WORKBENCH}${ROUTES.DASHBOARD}${ROUTES.TICKETS}/create`}
          className="wb-link"
        >
          Add Ticket
        </Link>
      }
      contentShouldScroll
    >
      <Tickets />
    </SectionTableWrapper>
  );
}

export default Dashboard;
