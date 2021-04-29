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
import { Icon, LoadingSpinner, Section, SectionTable } from '_common';
import { AllocationsTable } from './AllocationsTables';
import { AllocationsRequestModal } from './AllocationsModals';
import * as ROUTES from '../../constants/routes';

import './Allocations.global.css';

export const Header = ({ page }) => {
  return (
    /* !!!: Temporary extra markup to make simpler PR diff */
    /* eslint-disable prettier/prettier */
    <>
        <Link to={`${ROUTES.WORKBENCH}${ROUTES.ALLOCATIONS}`}>Allocations</Link>
        <span>&nbsp;/&nbsp;</span>
        <span>{page[0].toUpperCase() + page.substring(1)}</span>
    </>
    /* eslint-enable prettier/prettier */
  );
};
Header.propTypes = { page: string.isRequired };

export const Actions = ({ page }) => {
  const root = `${ROUTES.WORKBENCH}${ROUTES.ALLOCATIONS}/${page}`;
  return (
    /* !!!: Temporary extra markup to make simpler PR diff */
    <>
      <Link to={`${root}/manage`} className="btn btn-primary">
        Manage Allocations
      </Link>
    </>
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
    /* !!!: Temporary bad indentation to make simpler PR diff */
    /* eslint-disable prettier/prettier */
    <Section
      bodyClassName="has-loaded-allocations"
      routeName="ALLOCATIONS"
      header={
      <Header page={page} />
      }
      headerClassName="allocations-header"
      headerActions={<Actions page={page} />}
      content={
      <>
        <Sidebar />
        {loading ? (
          <LoadingSpinner className="allocations-loading-icon" />
        ) : (
          <SectionTable className="allocations-content" contentShouldScroll>
            <AllocationsTable page={page} />
          </SectionTable>
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
    /* eslint-enable prettier/prettier */
  );
};
Layout.propTypes = {
  page: string.isRequired
};
