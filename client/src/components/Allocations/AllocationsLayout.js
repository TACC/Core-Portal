import React from 'react';
import { useSelector } from 'react-redux';
import { Link, NavLink as RRNavLink } from 'react-router-dom';
import { Button, Nav, NavItem, NavLink } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboard, faDesktop } from '@fortawesome/free-solid-svg-icons';
import { string } from 'prop-types';
import LoadingSpinner from '_common/LoadingSpinner';
import { AllocationsTable } from './AllocationsTables';
import { NewAllocReq } from './AllocationsModals';
import * as ROUTES from '../../constants/routes';

export const Header = ({ page }) => {
  const [openModal, setOpenModal] = React.useState(false);
  return (
    <div id="allocations-header">
      <div id="header-text">
        <Link to={`${ROUTES.WORKBENCH}${ROUTES.ALLOCATIONS}`}>Allocations</Link>
        <span>&nbsp;/&nbsp;</span>
        <span>{page[0].toUpperCase() + page.substring(1)}</span>
      </div>
      <Button color="primary" onClick={() => setOpenModal(true)}>
        Manage Allocations
      </Button>
      {openModal && (
        <NewAllocReq
          isOpen={openModal}
          toggle={() => setOpenModal(!openModal)}
        />
      )}
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
        <FontAwesomeIcon icon={faClipboard} size="1x" className="link-icon" />
        <span className="link-text">Approved</span>
      </NavLink>
    </NavItem>
    <NavItem>
      <NavLink
        tag={RRNavLink}
        to={`${ROUTES.WORKBENCH}${ROUTES.ALLOCATIONS}/expired`}
        activeClassName="active"
      >
        <FontAwesomeIcon icon={faDesktop} size="1x" className="link-icon" />
        <span className="link-text">Expired</span>
      </NavLink>
    </NavItem>
  </Nav>
);

export const Layout = ({ page }) => {
  const loading = useSelector(state => state.allocations.loading);
  if (loading)
    return (
      <>
        <Header page={page} />
        <div id="allocations-container">
          <Sidebar />
          <LoadingSpinner />
        </div>
      </>
    );
  return (
    <>
      <Header page={page} />
      <div id="allocations-container">
        <Sidebar />
        <AllocationsTable page={page} />
      </div>
    </>
  );
};
Layout.propTypes = {
  page: string.isRequired
};
