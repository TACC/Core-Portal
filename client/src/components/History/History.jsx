import React, { useEffect } from 'react';
import {
  Route,
  Routes as RouterRoutes,
  Navigate,
  useLocation,
  useParams,
  useMatch,
} from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import queryString from 'query-string';

import { Button, Section } from '_common';
import JobHistory from './HistoryViews';
import JobHistoryModal from './HistoryViews/JobHistoryModal';
import * as ROUTES from '../../constants/routes';
import HistoryBadge from './HistoryBadge';
import { Sidebar } from '_common';

import './History.global.css';
import styles from './History.module.scss';

const root = `${ROUTES.WORKBENCH}${ROUTES.HISTORY}`;

const Actions = () => {
  // Only display "Mark All as Viewed" button if there are purple (unread) notifs
  const unread = useSelector(
    (state) => state.notifications.list.notifs.filter((n) => !n.read).length
  );
  const dispatch = useDispatch();

  return (
    <Button
      type="link"
      onClick={() => {
        dispatch({
          type: 'NOTIFICATIONS_READ',
          payload: {
            onSuccess: { type: 'FETCH_NOTIFICATIONS' },
          },
        });
      }}
      disabled={!unread}
    >
      Mark All as Viewed
    </Button>
  );
};

const HistorySidebar = () => {
  const { unreadJobs } = useSelector((state) => state.notifications.list);

  const sidebarItems = [
    {
      to: `${root}/jobs`,
      label: 'Jobs',
      iconName: 'jobs',
      disabled: false,
      hidden: false,
      children: <HistoryBadge unread={unreadJobs} />,
    },
  ];

  return <Sidebar sidebarItems={sidebarItems} />;
};

const JobsSection = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { uuid: jobUuid } = useParams();

  useEffect(() => {
    const locationState = location.state || {};
    // Only mark as read if in pure job history view
    if (
      location.pathname === `${ROUTES.JOBS}` &&
      !locationState.fromJobHistoryModal
    ) {
      // Chain events to properly update UI based on read action
      dispatch({
        type: 'FETCH_NOTIFICATIONS',
        payload: {
          queryString: queryString.stringify({
            eventTypes: ['job', 'interactive_session_ready'],
          }),
          onSuccess: {
            type: 'NOTIFICATIONS_READ',
            payload: {
              body: {
                eventTypes: ['job', 'interactive_session_ready'],
              },
              onSuccess: {
                type: 'UPDATE_BADGE_COUNT',
                payload: { type: 'unreadJobs' },
              },
            },
          },
        },
      });
    }
  }, [dispatch, location.pathname, location.state]);

  useEffect(() => {
    if (jobUuid) {
      dispatch({
        type: 'GET_JOB_DETAILS',
        payload: { jobUuid },
      });
    }
  }, [dispatch, jobUuid]);

  return (
    <>
      <JobHistory className={styles.content} />
      {jobUuid && <JobHistoryModal uuid={jobUuid} />}
    </>
  );
};

export const Routes = () => {
  return (
    <RouterRoutes>
      <Route path={`${ROUTES.JOBS}/:uuid?`} element={<JobsSection />} />
      {/* Fallback for /workbench/history or any unmatched sub-path */}
      <Route
        path="*"
        element={<Navigate to={`${root}${ROUTES.JOBS}`} replace />}
      />
    </RouterRoutes>
  );
};

const Layout = () => {
  const historyMatch = useMatch(`${root}/:historyType/*`);
  const historyType = historyMatch?.params.historyType;

  const capitalizedType = historyType
    ? historyType.charAt(0).toUpperCase() + historyType.slice(1)
    : '';

  return (
    <Section
      bodyClassName="has-loaded-history"
      messageComponentName="HISTORY"
      header={`History / ${capitalizedType}`}
      headerClassName={styles['header']}
      headerActions={<Actions />}
      content={
        <>
          <HistorySidebar />
          <Routes />
        </>
      }
    />
  );
};

export default Layout;
