import React from 'react';
import { useSelector } from 'react-redux';
import {
  Link,
  NavLink as RRNavLink,
  Route,
  useHistory
} from 'react-router-dom';
import { Nav, NavItem, NavLink } from 'reactstrap';
import { string } from 'prop-types';
import { Icon, LoadingSpinner } from '_common';
import { AllocationsTable } from './AllocationsTables';
import { AllocationsRequestModal } from './AllocationsModals';
import * as ROUTES from '../../constants/routes';

export const Header = ({ page }) => {
  const root = `${ROUTES.WORKBENCH}${ROUTES.ALLOCATIONS}/${page}`;
  return (
    <div id="allocations-header">
      <div id="header-text">
        <Link to={`${ROUTES.WORKBENCH}${ROUTES.ALLOCATIONS}`}>Allocations</Link>
        <span>&nbsp;/&nbsp;</span>
        <span>{page[0].toUpperCase() + page.substring(1)}</span>
      </div>
      <Link to={`${root}/manage`} className="btn btn-primary">
        Manage Allocations
      </Link>
    </div>
  );
};
Header.propTypes = { page: string.isRequired };

export const Sidebar = () => (
  <Nav id="allocations-sidebar" vertical>
    <NavItem>
      <NavLink
        tag={RRNavLink}
        to={`${ROUTES.WORKBENCH}${ROUTES.ALLOCATIONS}/approved`}
        activeClassName="active"
      >
        <Icon name="approved-reverse" className="link-icon" />
        <span className="link-text">Approved</span>
      </NavLink>
    </NavItem>
    <NavItem>
      <NavLink
        tag={RRNavLink}
        to={`${ROUTES.WORKBENCH}${ROUTES.ALLOCATIONS}/expired`}
        activeClassName="active"
      >
        <Icon name="denied-reverse" className="link-icon" />
        <span className="link-text">Expired</span>
      </NavLink>
    </NavItem>
  </Nav>
);

export const Layout = ({ page }) => {
  const loading = useSelector(state => state.allocations.loading);
  const history = useHistory();
  const root = `${ROUTES.WORKBENCH}${ROUTES.ALLOCATIONS}/${page}`;
  return (
    <>
      <Header page={page} />
      <div id="allocations-container">
        <Sidebar />
        {loading ? <LoadingSpinner /> : <AllocationsTable page={page} />}
        <Route exact path={`${root}/manage`}>
          <AllocationsRequestModal
            isOpen
            toggle={() => {
              history.push(root);
            }}
          />
        </Route>
      </div>
    </>
  );
};
Layout.propTypes = {
  page: string.isRequired
};
