import React from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { NavLink as RRNavLink } from 'react-router-dom';
import { Button, Nav, NavItem, NavLink } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDesktop } from '@fortawesome/free-solid-svg-icons';
import { string } from 'prop-types';
import { LoadingSpinner } from '_common';
import HistoryBadge from './HistoryBadge';
import './History.module.scss';

export const Header = ({ title }) => {
  const dispatch = useDispatch();

  return (
    <div styleName="header">
      <span styleName="header-text"> History / {title} </span>
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
Header.propTypes = { title: string.isRequired };

export const Sidebar = ({ root }) => {
  const { notifs } = useSelector(
    state => state.notifications.list,
    shallowEqual
  );
  return (
    <Nav styleName="sidebar" vertical>
      <NavItem>
        <NavLink
          tag={RRNavLink}
          to={`${root}/jobs`}
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
          to={`${root}/uploads`}
          activeStyleName="active"
          className="nav-content"
        >
          <i className="icon icon-action-upload" />
          <span styleName="link-text">Uploads</span>
        </NavLink>
      </NavItem>
      <NavItem>
        <NavLink
          tag={RRNavLink}
          to={`${root}/files`}
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
Sidebar.propTypes = {
  root: string.isRequired
};

export const Layout = ({ page }) => {
  const loading = useSelector(state => state.notifications.loading);
  if (loading) return <LoadingSpinner />;
  return <></>;
};
Layout.propTypes = {
  page: string.isRequired
};
