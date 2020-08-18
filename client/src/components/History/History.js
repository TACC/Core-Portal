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
import { string, number } from 'prop-types';

import JobHistory from './HistoryViews';
import JobHistoryModal from './HistoryViews/JobHistoryModal';
import * as ROUTES from '../../constants/routes';
import HistoryBadge from './HistoryBadge';
import './History.module.scss';

const root = `${ROUTES.WORKBENCH}${ROUTES.HISTORY}`;

const Header = ({ title, unreadJobs }) => {
  const dispatch = useDispatch();

  return (
    <div styleName="header">
      <span styleName="header-text"> History / {title} </span>
      {unreadJobs ? (
        <Button
          color="link"
          onClick={() =>
            dispatch({
              type: 'NOTIFICATIONS_READ',
              payload: {
                id: 'all',
                read: true
              }
            })
          }
        >
          Mark All as Viewed
        </Button>
      ) : null}
    </div>
  );
};
Header.propTypes = { title: string.isRequired, unreadJobs: number.isRequired };

const Sidebar = ({ unreadJobs }) => {
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
Sidebar.propTypes = { unreadJobs: number.isRequired };

export const Routes = () => {
  const { path } = useRouteMatch();
  const dispatch = useDispatch();

  return (
    <div styleName="content" data-testid="history-router">
      <Switch>
        <Route path={`${root}/jobs`}>
          <JobHistory />
          <Switch>
            <Route
              path={`${ROUTES.WORKBENCH}${ROUTES.HISTORY}${ROUTES.JOBS}/:jobId`}
              render={({ match: { params } }) => {
                dispatch({
                  type: 'GET_JOB_DETAILS',
                  payload: { jobId: params.jobId }
                });
                return <JobHistoryModal jobId={params.jobId} />;
              }}
            />
          </Switch>
        </Route>
        {/* Redirect from /workbench/history to /workbench/history/jobs */}
        <Redirect from={root} to={`${root}/jobs`} />
        {/* Redirect from an unmatched path in /workbench/history/* to /workbench/history/jobs */}
        <Redirect from={path} to={`${root}/jobs`} />
      </Switch>
    </div>
  );
};

const Layout = () => {
  const unreadJobs = useSelector(state => state.notifications.list.unreadJobs);
  const match = useRouteMatch(`${root}/:historyType`);
  const historyType = match
    ? match.params.historyType.substring(0, 1).toUpperCase() +
      match.params.historyType.substring(1).toLowerCase()
    : '';

  return (
    <div styleName="root">
      <Header title={historyType} unreadJobs={unreadJobs} />
      <div styleName="container">
        <Sidebar unreadJobs={unreadJobs} />
        <Routes />
      </div>
    </div>
  );
};

export default Layout;
