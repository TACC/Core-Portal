import React from 'react';
import { Nav, NavItem, NavLink } from 'reactstrap';
import { NavLink as RRNavLink, useRouteMatch } from 'react-router-dom';
import * as ROUTES from '../../constants/routes';
import './Sidebar.scss';

/** A navigation list for the application */
const Sidebar = () => {
  const { path } = useRouteMatch();
  // use path to allow History only in local development (cep.dev)
  const fullPath = window.location.href;
  return (
    <Nav id="sidebar" className="side-nav" vertical>
      <NavItem>
        <NavLink
          tag={RRNavLink}
          exact
          to={`${path}${ROUTES.DASHBOARD}`}
          activeClassName="active"
        >
          <div className="nav-content">
            <i className="icon-nav icon-nav-dashboard" />
            <span className="nav-text">Dashboard</span>
          </div>
        </NavLink>
      </NavItem>
      <NavItem>
        <NavLink
          tag={RRNavLink}
          to={`${path}${ROUTES.DATA}`}
          activeClassName="active"
        >
          <div className="nav-content">
            <i className="icon-nav icon-nav-folder" />
            <span className="nav-text">Data Files</span>
          </div>
        </NavLink>
      </NavItem>
      <NavItem>
        <NavLink
          tag={RRNavLink}
          to={`${path}${ROUTES.APPLICATIONS}`}
          activeClassName="active"
        >
          <div className="nav-content">
            <i className="icon-nav icon-nav-application" />
            <span className="nav-text">Applications</span>
          </div>
        </NavLink>
      </NavItem>
      <NavItem>
        <NavLink
          tag={RRNavLink}
          to={`${path}${ROUTES.ALLOCATIONS}`}
          activeClassName="active"
        >
          <div className="nav-content">
            <i className="icon-nav icon-nav-allocation" />
            <span className="nav-text">Allocations</span>
          </div>
        </NavLink>
      </NavItem>
      {fullPath.startsWith('https://cep.dev/') && (
        <NavItem>
          <NavLink
            tag={RRNavLink}
            to={`${path}${ROUTES.HISTORY}`}
            activeClassName="active"
          >
            <div className="nav-content">
              <i className="icon-nav icon-nav-allocation" />
              <span className="nav-text">History</span>
            </div>
          </NavLink>
        </NavItem>
      )}
    </Nav>
  );
};

export default Sidebar;
