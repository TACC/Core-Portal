import React from 'react';
import { Nav, NavItem, NavLink } from 'reactstrap';
import { NavLink as RRNavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDesktop, faCog } from '@fortawesome/free-solid-svg-icons';
import { faBell, faFolder } from '@fortawesome/free-regular-svg-icons';
import './sidebar.css';


export default function Sidebar() {

  return (
    <div className="side-nav">
      <Nav id="sidebar" vertical>
        <NavItem>
          <NavLink tag={RRNavLink} exact to="/workbench/dashboard/" activeClassName="active">
            <div className="nav-content">
              <FontAwesomeIcon icon={faDesktop} size="1x" className="side-nav-icon" />
              <span className="nav-text">Dashboard</span>
            </div>
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink tag={RRNavLink} exact to="/workbench/data/" activeClassName="active">
            <div className="nav-content">
              <FontAwesomeIcon icon={faFolder} size="1x" className="side-nav-icon" />
              <span className="nav-text">Data Files</span>
            </div>
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink tag={RRNavLink} exact to="/workbench/applications/" activeClassName="active">
            <div className="nav-content">
              <FontAwesomeIcon icon={faCog} size="1x" className="side-nav-icon" />
              <span className="nav-text">Applications</span>
            </div>
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink tag={RRNavLink} exact to="/workbench/allocations/" activeClassName="active">
            <div className="nav-content">
              <FontAwesomeIcon icon={faCog} size="1x" className="side-nav-icon" />
              <span className="nav-text">Allocations</span>
            </div>
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink tag={RRNavLink} exact to="/workbench/publications/" activeClassName="active">
            <div className="nav-content">
              <FontAwesomeIcon icon={faFolder} size="1x" className="side-nav-icon" />
              <span className="nav-text">Publications</span>
            </div>
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink tag={RRNavLink} exact to="/workbench/history/" activeClassName="active">
            <div className="nav-content">
              <FontAwesomeIcon icon={faBell} size="1x" className="side-nav-icon" />
              <span className="nav-text">History</span>
            </div>
          </NavLink>
        </NavItem>
      </Nav>
    </div>
  )
}
