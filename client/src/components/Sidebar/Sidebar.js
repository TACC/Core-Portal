import React from 'react';
import { Nav, NavItem, NavLink } from 'reactstrap';
import { NavLink as RRNavLink, useRouteMatch } from 'react-router-dom';
import * as ROUTES from '../../constants/routes';
import {
  NavStyled,
  NavLinkStyled,
  SidebarLinkContent,
  SidebarLinkText,
  NavIcon
} from './Sidebar.styles.js';
import './Sidebar.css';

/** A navigation list for the application */
const Sidebar = () => {
  const { path } = useRouteMatch();
  return (
    <NavStyled vertical>
      <NavItem>
        <NavLinkStyled
          tag={RRNavLink}
          exact
          to={`${path}${ROUTES.DASHBOARD}`}
          activeClassName="active"
        >
          <SidebarLinkContent>
            <NavIcon className="icon-nav icon-nav-dashboard" />
            <SidebarLinkText>Dashboard</SidebarLinkText>
          </SidebarLinkContent>
        </NavLinkStyled>
      </NavItem>
      <NavItem>
        <NavLinkStyled
          tag={RRNavLink}
          to={`${path}${ROUTES.DATA}`}
          activeClassName="active"
        >
          <SidebarLinkContent>
            <NavIcon className="icon-nav icon-nav-folder" />
            <SidebarLinkText>Data Files</SidebarLinkText>
          </SidebarLinkContent>
        </NavLinkStyled>
      </NavItem>
      <NavItem>
        <NavLinkStyled
          tag={RRNavLink}
          to={`${path}${ROUTES.APPLICATIONS}`}
          activeClassName="active"
        >
          <SidebarLinkContent>
            <NavIcon className="icon-nav icon-nav-application" />
            <SidebarLinkText>Applications</SidebarLinkText>
          </SidebarLinkContent>
        </NavLinkStyled>
      </NavItem>
      <NavItem>
        <NavLinkStyled
          tag={RRNavLink}
          to={`${path}${ROUTES.ALLOCATIONS}`}
          activeClassName="active"
        >
          <SidebarLinkContent>
            <NavIcon className="icon-nav icon-nav-allocation" />
            <SidebarLinkText>Allocations</SidebarLinkText>
          </SidebarLinkContent>
        </NavLinkStyled>
      </NavItem>
    </NavStyled>
  );
};

export default Sidebar;
