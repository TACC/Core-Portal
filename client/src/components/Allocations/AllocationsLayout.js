import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { Link, NavLink as RRNavLink } from 'react-router-dom';
import { Button, Nav, NavItem, NavLink } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSun,
  faClipboard,
  faClock,
  faDesktop
} from '@fortawesome/free-solid-svg-icons';
import { ActiveTable, InactiveTable } from './AllocationsTables';
import { NewAllocReq } from './AllocationsModals';

export const Header = ({ title }) => {
  const [openModal, setOpenModal] = React.useState(false);
  return (
    <div id="allocations-header">
      <div id="header-text">
        <Link to="/workbench/allocations">Allocations</Link>
        {title ? (
          <>
            <span>&nbsp;/&nbsp;</span>
            <span>{title[0].toUpperCase() + title.substring(1)}</span>
          </>
        ) : (
          ''
        )}
      </div>
      <Button onClick={() => setOpenModal(true)}>Request New Allocation</Button>
      {openModal && (
        <NewAllocReq
          isOpen={openModal}
          toggle={() => setOpenModal(!openModal)}
        />
      )}
    </div>
  );
};
Header.propTypes = {
  title: PropTypes.string
};
Header.defaultProps = {
  title: ''
};

export const Sidebar = props => (
  <Nav id="allocations-sidebar" vertical>
    <NavItem>
      <NavLink
        tag={RRNavLink}
        to="/workbench/allocations/approved"
        activeClassName="active"
      >
        <FontAwesomeIcon icon={faClipboard} size="1x" className="link-icon" />
        <span className="link-text">Approved</span>
      </NavLink>
    </NavItem>
    <NavItem>
      <NavLink
        tag={RRNavLink}
        to="/workbench/allocations/pending"
        activeClassName="active"
      >
        <FontAwesomeIcon icon={faClock} size="1x" className="link-icon" />
        <span className="link-text">Pending</span>
      </NavLink>
    </NavItem>
    <NavItem>
      <NavLink
        tag={RRNavLink}
        to="/workbench/allocations/expired"
        activeClassName="active"
      >
        <FontAwesomeIcon icon={faDesktop} size="1x" className="link-icon" />
        <span className="link-text">Expired</span>
      </NavLink>
    </NavItem>
  </Nav>
);

export const Loading = () => (
  <div id="loading">
    <FontAwesomeIcon icon={faSun} size="8x" spin />
  </div>
);
export const Pending = () => <div id="pending" />;

export const ContentWrapper = ({ page }) => {
  const loading = useSelector(state => state.spinner);
  const allocations = useSelector(state => state.allocations);
  const showTable = p => {
    switch (p) {
      case 'Approved':
        return <ActiveTable allocations={allocations.allocs} />;
      case 'Pending':
        return <Pending />;
      default:
        return <InactiveTable allocations={allocations.inactive} />;
    }
  };
  if (loading)
    return (
      <div id="allocations-container">
        <Sidebar />
        <Loading />
      </div>
    );
  return (
    <div id="allocations-container">
      <Sidebar />
      {showTable(page)}
    </div>
  );
};
ContentWrapper.propTypes = { page: PropTypes.string };
ContentWrapper.defaultProps = { page: 'Approved' };

export const Layout = ({ filter, children }) => (
  <>
    <Header title={filter} />
    <ContentWrapper page={filter} />
    {children}
  </>
);
Layout.propTypes = {
  filter: PropTypes.string.isRequired,
  children: PropTypes.node
};
Layout.defaultProps = {
  children: <div />
};
