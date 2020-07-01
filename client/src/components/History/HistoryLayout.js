import React from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { NavLink as RRNavLink } from 'react-router-dom';
import { Button, Nav, NavItem, NavLink } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDesktop } from '@fortawesome/free-solid-svg-icons';
import { string } from 'prop-types';
import { LoadingSpinner } from '_common';
import { HistoryTable } from './HistoryTable';
import HistoryBadge from './HistoryBadge';
import * as ROUTES from '../../constants/routes';
import './History.module.scss';

export const Header = ({ page }) => {
  const dispatch = useDispatch();

  return (
    <div styleName="history-header">
      <div styleName="header-text">
        History
        <span>&nbsp;/&nbsp;</span>
        <span>{page[0].toUpperCase() + page.substring(1)}</span>
      </div>
      <Button
        color="link"
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

export const Sidebar = () => {
  const { notifs } = useSelector(
    state => state.notifications.list,
    shallowEqual
  );
  return (
    <Nav styleName="history-sidebar" vertical>
      <NavItem>
        <NavLink
          tag={RRNavLink}
          to={`${ROUTES.WORKBENCH}${ROUTES.HISTORY}/jobs`}
          activeStyleName="active"
          className="nav-content"
        >
          <FontAwesomeIcon icon={faDesktop} size="1x" styleName="link-icon" />
          <span styleName="link-text">Jobs</span>
          <HistoryBadge
            unread={
              notifs.filter(n => !n.read && n.event_type === 'job').length
            }
          />
        </NavLink>
      </NavItem>
      <NavItem>
        <NavLink
          tag={RRNavLink}
          to={`${ROUTES.WORKBENCH}${ROUTES.HISTORY}/uploads`}
          className="nav-content"
          activeStyleName="active"
        >
          <i className="icon icon-action-upload" />
          <span styleName="link-text">Uploads</span>
        </NavLink>
      </NavItem>
      <NavItem>
        <NavLink
          tag={RRNavLink}
          to={`${ROUTES.WORKBENCH}${ROUTES.HISTORY}/files`}
          activeStyleName="active"
          className="nav-content"
        >
          <i className="icon icon-nav-folder" />
          <span styleName="link-text">Files</span>
        </NavLink>
      </NavItem>
    </Nav>
  );
};

export const Layout = ({ page }) => {
  const loading = useSelector(state => state.notifications.loading);
  if (loading)
    return (
      <>
        <Header page={page} />
        <div styleName="history-container">
          <Sidebar />
          <LoadingSpinner />
        </div>
      </>
    );
  return (
    <>
      <Header page={page} />
      <div styleName="history-container">
        <Sidebar />
        <HistoryTable page={page} />
      </div>
    </>
  );
};
Layout.propTypes = {
  page: string.isRequired
};
