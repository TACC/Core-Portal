import React from 'react';
import { useSelector } from 'react-redux';
import {
  Link,
  NavLink as RRNavLink,
  Route,
  useHistory,
  Switch,
  Redirect,
} from 'react-router-dom';
import { Nav, NavItem, NavLink } from 'reactstrap';
import { string } from 'prop-types';
import { Icon, LoadingSpinner, Section, SectionTableWrapper } from '_common';
import { AllocationsTable } from './AllocationsTables';
import {
  AllocationsRequestModal,
  AllocationsTeamViewModal,
} from './AllocationsModals';
import * as ROUTES from '../../constants/routes';
import { Sidebar as CommonSidebar } from '_common';

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
      Request New Allocation
    </Link>
  );
};
Actions.propTypes = { page: string.isRequired };

export const Layout = ({ page }) => {
  const loading = useSelector((state) => state.allocations.loading);
  const history = useHistory();
  const root = `${ROUTES.WORKBENCH}${ROUTES.ALLOCATIONS}`;

  const sidebarItems = [
    {
      to: `${root}/approved`,
      label: 'Approved',
      iconName: 'approved-allocations',
      disabled: false,
      hidden: false,
    },
    {
      to: `${root}/expired`,
      label: 'Expired',
      iconName: 'pending',
      disabled: false,
      hidden: false,
    },
  ];

  return (
    <Section
      bodyClassName="has-loaded-allocations"
      messageComponentName="ALLOCATIONS"
      header={<Header page={page} />}
      headerClassName="allocations-header"
      headerActions={<Actions page={page} />}
      content={
        <>
          <CommonSidebar sidebarItems={sidebarItems} />
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
          <Switch>
            <Route exact path={`${root}/${page}/manage`}>
              <AllocationsRequestModal
                isOpen
                toggle={() => {
                  history.push(`${root}/${page}`);
                }}
              />
            </Route>
            <Route exact path={`${root}/${page}/:projectId(\\d+)`}>
              <AllocationsTeamViewModal
                isOpen
                toggle={() => {
                  history.push(`${root}/${page}`);
                }}
              />
            </Route>
            <Redirect to={`${root}/${page}`} />
          </Switch>
        </>
      }
    />
  );
};
Layout.propTypes = {
  page: string.isRequired,
};
