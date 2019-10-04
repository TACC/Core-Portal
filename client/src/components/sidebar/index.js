import React from 'react';
import { Nav, NavItem, NavLink } from 'reactstrap';
import { NavLink as RRNavLink } from 'react-router-dom';

export default function Workbench() {

  return (

    <Nav id="sidebar" vertical>
      <div className="sidebar-header">
        <h3>Workbench</h3>
      </div>

      <NavItem>
        <NavLink tag={RRNavLink} exact to="/workbench/dashboard/" activeClassName="active">Dashboard</NavLink>
      </NavItem>
      <NavItem>
        <NavLink tag={RRNavLink} exact to="/workbench/data/" activeClassName="active">Data Files</NavLink>
      </NavItem>
      <NavItem>
        <NavLink tag={RRNavLink} exact to="/workbench/applications/" activeClassName="active">Applications</NavLink>
      </NavItem>
      <NavItem>
        <NavLink tag={RRNavLink} exact to="/workbench/allocations/" activeClassName="active">Allocations</NavLink>
      </NavItem>
      <NavItem>
        <NavLink tag={RRNavLink} exact to="/workbench/publications/" activeClassName="active">Publications</NavLink>
      </NavItem>
    </Nav>

  )
}
