import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, Route, Switch } from 'react-router-dom';

import { BrowserChecker, Section, SectionTableWrapper } from '_common';
import JobsView from '../Jobs';
import Tickets, { TicketModal } from '../Tickets';
import Sysmon from '../SystemMonitor';
import * as ROUTES from '../../constants/routes';
import './Dashboard.global.css';
import styles from './Dashboard.module.css';
import CustomDashboardSection from './CustomDashboardSection';

function getPanelCount(standardApps = [], optionalApps = [], customApps = []) {
  return standardApps.length + optionalApps.length + customApps.length;
}

function Dashboard() {
  const { hideApps, hideManageAccount, customDashboardSection } = useSelector(
    (state) => state.workbench.config
  );
  const { hideSystemMonitor } = useSelector((state) => state.systemMonitor);
  const panelCount = getPanelCount(
    ['DashboardTickets'],
    [hideApps, hideSystemMonitor].filter((isHidden) => !isHidden),
    ...(Boolean(customDashboardSection) ? [['customDashboardSection']] : [])
  );

  const contentLayoutName =
    panelCount === 1
      ? 'oneColumn'
      : panelCount === 2 && customDashboardSection
        ? 'twoColumnUnequal'
        : panelCount === 2 && !customDashboardSection
          ? 'twoColumn'
          : 'twoColumnUnequal';

  return (
    <Section
      bodyClassName="has-loaded-dashboard"
      messageComponentName="DASHBOARD"
      messages={<BrowserChecker />}
      header="Dashboard"
      headerActions={
        !hideManageAccount && (
          <Link to={`${ROUTES.WORKBENCH}${ROUTES.ACCOUNT}`} className="wb-link">
            Manage Account
          </Link>
        )
      }
      contentClassName={`${styles['panels']} count--${panelCount}`}
      contentLayoutName={contentLayoutName}
      contentShouldScroll
      content={
        <>
          {!hideApps && <DashboardJobs />}
          <DashboardTickets />
          {!hideSystemMonitor && <DashboardSysmon />}
          {customDashboardSection && (
            <CustomDashboardSection className={styles['custom-panel']} />
          )}
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
            type: 'TICKET_CREATE_OPEN_MODAL',
          });
        }}
      />
      <Route
        path={`${ROUTES.WORKBENCH}${ROUTES.DASHBOARD}${ROUTES.TICKETS}/:ticketId`}
        render={({ match: { params } }) => {
          dispatch({
            type: 'TICKET_DETAILED_VIEW_OPEN',
            payload: { ticketId: Number(params.ticketId) },
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
      className={styles['sysmon-panel']}
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
      <JobsView includeSearchbar={false} />
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
          className="btn btn-secondary btn-sm"
        >
          New Ticket
        </Link>
      }
      contentShouldScroll
    >
      <Tickets />
    </SectionTableWrapper>
  );
}

export default Dashboard;
