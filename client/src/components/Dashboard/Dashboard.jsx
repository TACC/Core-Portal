import React from 'react';
import { useSelector } from 'react-redux';
import { Route, Routes, useParams } from 'react-router-dom';
import { BrowserChecker, Section, SectionTableWrapper, Link } from '_common';
import JobsView from '../Jobs';
import Tickets, { TicketCreateModal, TicketModal } from '../Tickets';
import Sysmon from '../SystemMonitor';
import UserNewsDashboard from '../UserNews';
import * as ROUTES from '../../constants/routes';
import './Dashboard.global.css';
import styles from './Dashboard.module.css';
import CustomDashboardSection from './CustomDashboardSection';
import { useWorkbenchConfig } from '@tacc/core-hooks';

function getPanelCount(standardApps = [], optionalApps = [], customApps = []) {
  return standardApps.length + optionalApps.length + customApps.length;
}

function Dashboard() {
  const {
    data: {
      config: {
        hideApps,
        hideManageAccount,
        showUserNews = false,
        customDashboardSection,
      },
    },
  } = useWorkbenchConfig();

  const { hideSystemMonitor } = useSelector((state) => state.systemMonitor);
  const panelCount = getPanelCount(
    ['DashboardTickets', ...(showUserNews ? ['DashboardUserNews'] : [])],
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
          {showUserNews && <DashboardUserNews />}
          {customDashboardSection && (
            <CustomDashboardSection className={styles['custom-panel']} />
          )}
          <DashboardRoutes />
        </>
      }
    />
  );
}

function TicketCreateRoute() {
  return (
    <TicketCreateModal
      isModalOpen={true}
      setIsModalOpen={() => null}
      showAsModalOnDashboard
    />
  );
}

function TicketDetailRoute() {
  const { ticketId } = useParams();
  return <TicketModal ticketId={ticketId} />;
}

function DashboardRoutes() {
  return (
    <Routes>
      <Route
        exact
        path={`${ROUTES.TICKETS}/create`}
        element={<TicketCreateRoute />}
      />
      <Route
        path={`${ROUTES.TICKETS}/:ticketId`}
        element={<TicketDetailRoute />}
      />
    </Routes>
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
          type="button"
          className="c-button c-button--secondary"
          href={`${ROUTES.WORKBENCH}${ROUTES.DASHBOARD}${ROUTES.TICKETS}/create`}
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

function DashboardUserNews() {
  return (
    <SectionTableWrapper
      header="User News"
      headerActions={
        <span>
          <Link
            to={ROUTES.USER_NEWS}
            className="wb-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            View All Updates
          </Link>
          {' | '}
          <a
            href="https://accounts.tacc.utexas.edu/subscriptions"
            className="wb-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            Manage
          </a>
        </span>
      }
      className={styles['user-news-panel']}
      contentShouldScroll
    >
      <UserNewsDashboard />
    </SectionTableWrapper>
  );
}

export default Dashboard;
