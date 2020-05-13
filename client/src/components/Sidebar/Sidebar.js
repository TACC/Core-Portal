import React from 'react';
import { Nav, NavItem, NavLink } from 'reactstrap';
import { NavLink as RRNavLink, useRouteMatch } from 'react-router-dom';
import * as ROUTES from '../../constants/routes';
import './Sidebar.global.scss';
import classNames from './Sidebar.module.scss';

/** A navigation list for the application */
const Sidebar = () => {
  const { path } = useRouteMatch();
  return (
    <Nav className={classNames.root} vertical>
      <NavItem>
        <NavLink
          tag={RRNavLink}
          exact
          to={`${path}${ROUTES.DASHBOARD}`}
          className={classNames.link}
          activeClassName={classNames['link--active']}
        >
          <div className={classNames.content}>
            <i className="icon-nav icon-nav-dashboard" />
            <span className={classNames.text}>Dashboard</span>
          </div>
        </NavLink>
      </NavItem>
      <NavItem>
        <NavLink
          tag={RRNavLink}
          to={`${path}${ROUTES.DATA}`}
          className={classNames.link}
          activeClassName={classNames['link--active']}
        >
          <div className={classNames.content}>
            <i className="icon-nav icon-nav-folder" />
            <span className={classNames.text}>Data Files</span>
          </div>
        </NavLink>
      </NavItem>
      <NavItem>
        <NavLink
          tag={RRNavLink}
          to={`${path}${ROUTES.APPLICATIONS}`}
          className={classNames.link}
          activeClassName={classNames['link--active']}
        >
          <div className={classNames.content}>
            <i className="icon-nav icon-nav-application" />
            <span className={classNames.text}>Applications</span>
          </div>
        </NavLink>
      </NavItem>
      <NavItem>
        <NavLink
          tag={RRNavLink}
          to={`${path}${ROUTES.ALLOCATIONS}`}
          className={classNames.link}
          activeClassName={classNames['link--active']}
        >
          <div className={classNames.content}>
            <i className="icon-nav icon-nav-allocation" />
            <span className={classNames.text}>Allocations</span>
          </div>
        </NavLink>
      </NavItem>
    </Nav>
  );
};

export default Sidebar;
