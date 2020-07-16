import React from 'react';
import { Nav, NavItem, NavLink } from 'reactstrap';
import { NavLink as RRNavLink, useRouteMatch } from 'react-router-dom';
import { useSelector } from 'react-redux';
import * as ROUTES from '../../constants/routes';
import './Sidebar.global.scss'; // XXX: Global stylesheet imported in component
import './Sidebar.module.scss';

/** A navigation list for the application */
const Sidebar = () => {
  // show History only in local development
  const showHistory = useSelector(state =>
    state.workbench.status ? state.workbench.status.debug : false
  );
  let { path } = useRouteMatch();
  if (path.includes('accounts')) path = ROUTES.WORKBENCH;
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
            <i className="icon icon-nav-dashboard" />
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
            <i className="icon icon-nav-folder" />
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
            <i className="icon icon-nav-application" />
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
            <i className="icon icon-nav-allocation" />
            <span styleName="text">Allocations</span>
          </div>
        </NavLink>
      </NavItem>
      {showHistory && (
        <NavItem>
          <NavLink
            tag={RRNavLink}
            to={`${path}${ROUTES.HISTORY}`}
            styleName="link"
            activeStyleName="link--active"
          >
            <div styleName="content" className="nav-content">
              <i className="icon icon-nav icon-nav-notification" />
              <span styleName="text">History</span>
            </div>
          </NavLink>
        </NavItem>
      )}
    </Nav>
  );
};

export default Sidebar;
