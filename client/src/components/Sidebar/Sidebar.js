import React from 'react';
import { Nav, NavItem, NavLink } from 'reactstrap';
import { NavLink as RRNavLink, useRouteMatch } from 'react-router-dom';
import { useSelector } from 'react-redux';
import * as ROUTES from '../../constants/routes';
import HistoryBadge from '../History/HistoryBadge';
import './Sidebar.global.scss'; // XXX: Global stylesheet imported in component
import './Sidebar.module.scss';

/** A navigation list for the application */
const Sidebar = () => {
  // Show some entries only in local development
  const isDebug = useSelector(state =>
    state.workbench.status ? state.workbench.status.debug : false
  );
  const showUIPatterns = isDebug;
  let { path } = useRouteMatch();
  if (path.includes('accounts')) path = ROUTES.WORKBENCH;

  const unread = useSelector(state => state.notifications.list.unread);

  return (
    <Nav styleName="root" vertical>
      <NavItem>
        <NavLink
          tag={RRNavLink}
          exact
          to={`${path}${ROUTES.DASHBOARD}`}
          styleName="link"
          activeStyleName="link--active"
        >
          <div styleName="content" className="nav-content">
            <i className="icon icon-dashboard" />
            <span styleName="text">Dashboard</span>
          </div>
        </NavLink>
      </NavItem>
      <NavItem>
        <NavLink
          tag={RRNavLink}
          to={`${path}${ROUTES.DATA}`}
          styleName="link"
          activeStyleName="link--active"
        >
          <div styleName="content" className="nav-content">
            <i className="icon icon-folder" />
            <span styleName="text">Data Files</span>
          </div>
        </NavLink>
      </NavItem>
      <NavItem>
        <NavLink
          tag={RRNavLink}
          to={`${path}${ROUTES.APPLICATIONS}`}
          styleName="link"
          activeStyleName="link--active"
        >
          <div styleName="content" className="nav-content">
            <i className="icon icon-applications" />
            <span styleName="text">Applications</span>
          </div>
        </NavLink>
      </NavItem>
      <NavItem>
        <NavLink
          tag={RRNavLink}
          to={`${path}${ROUTES.ALLOCATIONS}`}
          styleName="link"
          activeStyleName="link--active"
        >
          <div styleName="content" className="nav-content">
            <i className="icon icon-allocations" />
            <span styleName="text">Allocations</span>
          </div>
        </NavLink>
      </NavItem>
      <NavItem>
        <NavLink
          tag={RRNavLink}
          to={`${path}${ROUTES.HISTORY}`}
          styleName="link"
          activeStyleName="link--active"
        >
          <div styleName="content" className="nav-content">
            <i className="icon icon-history" />
            <span styleName="text">History</span>
            <HistoryBadge unread={unread} />
          </div>
        </NavLink>
      </NavItem>
      <NavItem>
        <NavLink
          tag={RRNavLink}
          to={`${path}${ROUTES.DEMO}`}
          styleName="link"
          activeStyleName="link--active"
        >
          <div styleName="content" className="nav-content">
            <i className="icon icon-monitor" />
            <span styleName="text">React Demo</span>
          </div>
        </NavLink>
      </NavItem>
      {showUIPatterns && (
        <NavItem>
          <NavLink
            tag={RRNavLink}
            to={`${path}${ROUTES.UI}`}
            styleName="link"
            activeStyleName="link--active"
          >
            <div styleName="content" className="nav-content">
              <i className="icon icon-copy" />
              <span styleName="text">UI Patterns</span>
            </div>
          </NavLink>
        </NavItem>
      )}
    </Nav>
  );
};

export default Sidebar;
