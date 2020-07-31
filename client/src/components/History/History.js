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
import { string } from 'prop-types';

import JobHistory from './HistoryViews';
import * as ROUTES from '../../constants/routes';
import HistoryBadge from './HistoryBadge';
import './History.module.scss';

const root = `${ROUTES.WORKBENCH}${ROUTES.HISTORY}`;

const Header = ({ title }) => {
  const dispatch = useDispatch();

  return (
    <div styleName="header">
      <span styleName="header-text"> History / {title} </span>
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
    </div>
  );
};
Header.propTypes = { title: string.isRequired };

const Sidebar = () => {
  const unreadJobs = useSelector(state => state.notifications.list.unreadJobs);

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
  return (
    <div styleName="content" data-testid="history-router">
      <Switch>
        <Route path={`${root}/jobs`}>
          <JobHistory />
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
  const match = useRouteMatch(`${root}/:historyType`);
  const historyType = match
    ? match.params.historyType.substring(0, 1).toUpperCase() +
      match.params.historyType.substring(1).toLowerCase()
    : '';

  return (
    <div styleName="root">
      <Header title={historyType} />
      <div styleName="container">
        <Sidebar />
        <Routes />
      </div>
    </div>
  );
};

export default Layout;
