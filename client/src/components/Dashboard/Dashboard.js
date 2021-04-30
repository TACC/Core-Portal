import React from 'react';
import { useDispatch } from 'react-redux';
import { Link, Route, Switch } from 'react-router-dom';

import { BrowserChecker, Section, SectionTableWrapper } from '_common';
import JobsView from '../Jobs';
import Tickets, { TicketModal } from '../Tickets';
import Sysmon from '../SystemMonitor';
import * as ROUTES from '../../constants/routes';
import './Dashboard.global.css';
import './Dashboard.module.css';

function Dashboard() {
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
      contentStyleName="dashboard-items"
      contentLayoutName="twoColumn"
      contentShouldScroll
      content={
        <>
          <DashboardSysmon />
          <DashboardJobs />
          <DashboardTickets />
          <DashboardRoutes />
        </>
      }
    />
  );
}

function DashboardRoutes() {
  const dispatch = useDispatch();

  return (
    /* !!!: Temporary bad indentation to make simpler PR diff */
    /* eslint-disable prettier/prettier */
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
    /* eslint-enable prettier/prettier */
  );
}

function DashboardSysmon() {
  return (
    <SectionTableWrapper
      header="System Status"
      className="sysmon-wrapper"
      contentShouldScroll
    >
      <Sysmon />
    </SectionTableWrapper>
  );
}

function DashboardJobs() {
  return (
    <SectionTableWrapper
      className="jobs-wrapper"
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
      className="tickets-wrapper"
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
