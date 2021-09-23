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
import { Icon, LoadingSpinner, Section, SectionTableWrapper } from '_common';
import { AllocationsTable } from './AllocationsTables';
import { AllocationsRequestModal } from './AllocationsModals';
import * as ROUTES from '../../constants/routes';

import './Allocations.global.css';

export const Header = ({ page }) => {
  return (
    <>
      <Link to={`${ROUTES.WORKBENCH}${ROUTES.ALLOCATIONS}`}>Allocations</Link>
      <span>&nbsp;/&nbsp;</span>
      <span>{page[0].toUpperCase() + page.substring(1)}</span>
    </>
  );
};
Header.propTypes = { page: string.isRequired };

export const Actions = ({ page }) => {
  const root = `${ROUTES.WORKBENCH}${ROUTES.ALLOCATIONS}/${page}`;
  return (
    <Link to={`${root}/manage`} className="btn btn-primary">
      Manage Allocations
    </Link>
  );
};
Actions.propTypes = { page: string.isRequired };

export const Sidebar = () => (
  <Nav className="allocations-sidebar" vertical>
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
    <Section
      bodyClassName="has-loaded-allocations"
      introMessageName="ALLOCATIONS"
      header={<Header page={page} />}
      headerClassName="allocations-header"
      headerActions={<Actions page={page} />}
      content={
        <>
          <Sidebar />
          {loading ? (
            <LoadingSpinner className="allocations-loading-icon" />
          ) : (
            <SectionTableWrapper
              className="allocations-content"
              contentShouldScroll
            >
              <AllocationsTable page={page} />
            </SectionTableWrapper>
          )}
          <Route exact path={`${root}/manage`}>
            <AllocationsRequestModal
              isOpen
              toggle={() => {
                history.push(root);
              }}
            />
          </Route>
        </>
      }
    />
  );
};
Layout.propTypes = {
  page: string.isRequired
};
