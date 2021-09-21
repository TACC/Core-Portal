import React from 'react';
import {
  Route,
  Switch,
  Redirect,
  useRouteMatch,
  NavLink as RRNavLink
} from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Nav, NavItem, NavLink } from 'reactstrap';
import queryString from 'query-string';

import { Section } from '_common';
import JobHistory from './HistoryViews';
import JobHistoryModal from './HistoryViews/JobHistoryModal';
import * as ROUTES from '../../constants/routes';
import HistoryBadge from './HistoryBadge';

import './History.global.css';
import './History.module.scss';

const root = `${ROUTES.WORKBENCH}${ROUTES.HISTORY}`;

const Actions = () => {
  // Only display "Mark All as Viewed" button if there are purple (unread) notifs
  const unread = useSelector(
    state => state.notifications.list.notifs.filter(n => !n.read).length
  );
  const dispatch = useDispatch();

  return (
    <Button
      color="link"
      onClick={() => {
        dispatch({
          type: 'NOTIFICATIONS_READ',
          payload: {
            onSuccess: { type: 'FETCH_NOTIFICATIONS' }
          }
        });
      }}
      disabled={!unread}
    >
      Mark All as Viewed
    </Button>
  );
};

const Sidebar = () => {
  const { unreadJobs } = useSelector(state => state.notifications.list);
  return (
    <Nav styleName="sidebar" vertical>
      <NavItem>
        <NavLink
          tag={RRNavLink}
          to={`${root}/jobs`}
          activeStyleName="active"
          className="nav-content"
        >
          <i className="icon icon-jobs" />
          <span styleName="link-text">Jobs</span>
          <HistoryBadge unread={unreadJobs} />
        </NavLink>
      </NavItem>
    </Nav>
  );
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
                  eventTypes: ['job', 'interactive_session_ready']
                }),
                onSuccess: {
                  type: 'NOTIFICATIONS_READ',
                  payload: {
                    body: {
                      eventTypes: ['job', 'interactive_session_ready']
                    },
                    onSuccess: {
                      type: 'UPDATE_BADGE_COUNT',
                      payload: { type: 'unreadJobs' }
                    }
                  }
                }
              }
            });
          }
          return (
            <>
              <JobHistory styleName="content" />
              <Route
                path={`${ROUTES.WORKBENCH}${ROUTES.HISTORY}${ROUTES.JOBS}/:jobId`}
                render={({
                  match: {
                    params: { jobId }
                  }
                }) => {
                  dispatch({
                    type: 'GET_JOB_DETAILS',
                    payload: { jobId }
                  });
                  return <JobHistoryModal jobId={jobId} />;
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
  const match = useRouteMatch(`${root}/:historyType`);
  const historyType = match
    ? match.params.historyType.substring(0, 1).toUpperCase() +
      match.params.historyType.substring(1).toLowerCase()
    : '';

  return (
    <Section
      bodyClassName="has-loaded-history"
      introMessageName="HISTORY"
      header={`History / ${historyType}`}
      headerStyleName="header"
      headerActions={<Actions />}
      content={
        <>
          <Sidebar />
          <Routes />
        </>
      }
    />
  );
};

export default Layout;
