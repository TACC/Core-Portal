import React, { memo } from 'react';
import {
  Route,
  Switch,
  Redirect,
  useRouteMatch,
  NavLink as RRNavLink
} from 'react-router-dom';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { Button, Nav, NavItem, NavLink } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDesktop } from '@fortawesome/free-solid-svg-icons';
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
  const { notifs } = useSelector(
    state => state.notifications.list,
    shallowEqual
  );
  return (
    <Nav styleName="sidebar" vertical>
      <NavItem>
        <NavLink
          tag={RRNavLink}
          to={`${root}/jobs`}
          activeStyleName="active"
          className="nav-content"
        >
          <FontAwesomeIcon icon={faDesktop} size="1x" styleName="link-icon" />
          <span styleName="link-text">Jobs</span>
          <HistoryBadge
            unread={
              notifs.filter(n => !n.read && n.event_type === 'job').length
            }
          />
        </NavLink>
      </NavItem>
      <NavItem>
        <NavLink
          tag={RRNavLink}
          to={`${root}/uploads`}
          activeStyleName="active"
          className="nav-content"
        >
          <i className="icon icon-action-upload" />
          <span styleName="link-text">Uploads</span>
        </NavLink>
      </NavItem>
      <NavItem>
        <NavLink
          tag={RRNavLink}
          to={`${root}/files`}
          activeStyleName="active"
          className="nav-content"
        >
          <i className="icon icon-nav-folder" />
          <span styleName="link-text">Files</span>
        </NavLink>
      </NavItem>
    </Nav>
  );
};

const Routes = () => {
  const { path } = useRouteMatch();
  return (
    <div styleName="content" data-testid="history-router">
      <Switch>
        <Route exact path={`${root}/jobs`}>
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
    <div styleName="root" data-testid="history-router">
      <Header title={historyType} />
      <div styleName="container">
        <Sidebar />
        <Routes />
      </div>
    </div>
  );
};

export default memo(Layout);
