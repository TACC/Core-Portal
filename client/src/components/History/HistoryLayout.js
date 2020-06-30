import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, NavLink as RRNavLink } from 'react-router-dom';
import { Button, Nav, NavItem, NavLink } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDesktop } from '@fortawesome/free-solid-svg-icons';
import { string } from 'prop-types';
import { LoadingSpinner } from '_common';
import { HistoryTable } from './HistoryTable';
import * as ROUTES from '../../constants/routes';

export const Header = ({ page }) => {
  const dispatch = useDispatch();

  return (
    <div id="history-header">
      <div id="header-text">
        <Link to={`${ROUTES.WORKBENCH}${ROUTES.HISTORY}`}>history</Link>
        <span>&nbsp;/&nbsp;</span>
        <span>{page[0].toUpperCase() + page.substring(1)}</span>
      </div>
      <Button
        color="primary"
        onClick={() =>
          dispatch({
            type: 'NOTIFICATIONS_READ',
            payload: {
              id: 'all',
              read: true
            }
          })
        }
      >
        Mark All as Viewed
      </Button>
    </div>
  );
};
Header.propTypes = { page: string.isRequired };

export const Sidebar = () => (
  <Nav id="history-sidebar" vertical>
    <NavItem>
      <NavLink
        tag={RRNavLink}
        to={`${ROUTES.WORKBENCH}${ROUTES.HISTORY}/jobs`}
        activeClassName="active"
      >
        <FontAwesomeIcon icon={faDesktop} size="1x" className="link-icon" />
        <span className="link-text">Jobs</span>
      </NavLink>
    </NavItem>
    <NavItem>
      <NavLink
        tag={RRNavLink}
        to={`${ROUTES.WORKBENCH}${ROUTES.HISTORY}/uploads`}
        activeClassName="active"
      >
        <FontAwesomeIcon icon={faDesktop} size="1x" className="link-icon" />
        <span className="link-text">Uploads</span>
      </NavLink>
    </NavItem>
    <NavItem>
      <NavLink
        tag={RRNavLink}
        to={`${ROUTES.WORKBENCH}${ROUTES.HISTORY}/files`}
        activeClassName="active"
      >
        <FontAwesomeIcon icon={faDesktop} size="1x" className="link-icon" />
        <span className="link-text">Files</span>
      </NavLink>
    </NavItem>
  </Nav>
);

export const Layout = ({ page }) => {
  const loading = useSelector(state => state.notifications.loading);
  if (loading)
    return (
      <>
        <Header page={page} />
        <div id="notifications-container">
          <Sidebar />
          <LoadingSpinner />
        </div>
      </>
    );
  return (
    <>
      <Header page={page} />
      <div id="notifications-container">
        <Sidebar />
        <HistoryTable page={page} />
        {/* <div>{page}</div> */}
      </div>
    </>
  );
};
Layout.propTypes = {
  page: string.isRequired
};
