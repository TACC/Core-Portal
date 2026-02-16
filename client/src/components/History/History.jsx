import React from 'react';
import { Route, Switch, Redirect, useRouteMatch } from 'react-router-dom';
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
      disabled={unread}
    >
      Mark All as Viewed
    </Button>
  );
};

const HistorySidebar = () => {
  const { unreadJobs } = useSelector((state) => state.notifications.list);
  const { jobsv2Title } = useSelector((state) => state.workbench.config);

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

  // TODOv3: dropV2Jobs
  if (jobsv2Title) {
    sidebarItems.push({
      to: `${root}/jobsv2`,
      label: jobsv2Title,
      iconName: 'jobs',
      disabled: false,
      hidden: false,
    });
  }

  return <Sidebar sidebarItems={sidebarItems} />;
};

export const Routes = () => {
  const { path } = useRouteMatch();
  const dispatch = useDispatch();

  return (
    <Switch>
      <Route
        path={`${root}${ROUTES.JOBS}`}
        render={({ location: { pathname, state } }) => {
          const locationState = state || {};
          // Only mark as read if in pure job history view
          if (
            pathname === `${root}${ROUTES.JOBS}` &&
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
          return (
            <>
              <JobHistory className={styles.content} />
              <Route
                path={`${ROUTES.WORKBENCH}${ROUTES.HISTORY}${ROUTES.JOBS}/:jobUuid`}
                render={({
                  match: {
                    params: { jobUuid },
                  },
                }) => {
                  dispatch({
                    type: 'GET_JOB_DETAILS',
                    payload: { jobUuid },
                  });
                  return <JobHistoryModal uuid={jobUuid} />;
                }}
              />
            </>
          );
        }}
      />

      <Route
        // TODOv3: dropV2Jobs
        path={`${root}${ROUTES.JOBSV2}`}
        render={({ location: { pathname, state } }) => {
          const locationState = state || {};
          // Only mark as read if in pure job history view
          if (
            pathname === `${root}${ROUTES.JOBSV2}` &&
            !locationState.fromJobHistoryModal
          ) {
            dispatch({
              type: 'GET_V2_JOBS',
              params: { offset: 0 },
            });
          }
          return (
            <>
              <JobHistory className={styles.content} />
              <Route
                path={`${ROUTES.WORKBENCH}${ROUTES.HISTORY}${ROUTES.JOBSV2}/:jobId`}
                render={({
                  match: {
                    params: { jobId },
                  },
                }) => {
                  return <JobHistoryModal uuid={jobId} version="v2" />;
                }}
              />
            </>
          );
        }}
      />

      {/* Redirect from /workbench/history to /workbench/history/jobs */}
      <Redirect from={root} to={`${root}/jobs`} />
      {/* Redirect from an unmatched path in /workbench/history/* to /workbench/history/jobs */}
      <Redirect from={path} to={`${root}/jobs`} />
    </Switch>
  );
};

const Layout = () => {
  const { jobsv2Title } = useSelector((state) => state.workbench.config); // TODOv3: dropV2Jobs
  const match = useRouteMatch(`${root}/:historyType`);
  const historyType = match
    ? match.params.historyType.substring(0, 1).toUpperCase() +
      match.params.historyType.substring(1).toLowerCase()
    : '';

  return (
    <Section
      bodyClassName="has-loaded-history"
      messageComponentName="HISTORY"
      header={`History / ${
        historyType === 'Jobsv2' ? jobsv2Title : historyType // TODOv3: dropV2Jobs
      }`}
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
