import React from 'react';
import { Nav, NavItem, NavLink } from 'reactstrap';
import { NavLink as RRNavLink, useRouteMatch } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { Icon } from '_common';
import { FeedbackButton } from '../FeedbackForm';
import * as ROUTES from '../../constants/routes';
import HistoryBadge from '../History/HistoryBadge';
import './Sidebar.global.scss'; // XXX: Global stylesheet imported in component
import './Sidebar.module.scss';

/** Navigation list item **/
const SidebarItem = ({ to, label, iconName, children, disabled }) => {
  return (
    <NavItem>
      <NavLink
        tag={RRNavLink}
        to={to}
        styleName="link"
        activeStyleName="link--active"
        disabled={disabled}
      >
        <div
          styleName={disabled ? 'content disabled' : 'content'}
          className="nav-content"
        >
          <Icon name={iconName} />
          <span styleName="text">{label}</span>
          {children}
        </div>
      </NavLink>
    </NavItem>
  );
};

SidebarItem.propTypes = {
  to: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  iconName: PropTypes.string.isRequired,
  children: PropTypes.node,
  disabled: PropTypes.bool
};

SidebarItem.defaultProps = {
  children: null,
  disabled: false
};

/** A navigation list for the application */
const Sidebar = ({ disabled, showUIPatterns, loading }) => {
  let { path } = useRouteMatch();
  if (path.includes('accounts')) path = ROUTES.WORKBENCH;

  const unread = useSelector(state => state.notifications.list.unread);
  const hideApps = useSelector(state => state.workbench.config.hideApps);

  return (
    <Nav styleName="root" vertical>
      {!loading && (
        <>
          <SidebarItem
            to={`${path}${ROUTES.DASHBOARD}`}
            label="Dashboard"
            iconName="dashboard"
            disabled={disabled}
          />
          <SidebarItem
            to={`${path}${ROUTES.DATA}`}
            label="Data Files"
            iconName="folder"
            disabled={disabled}
          />
          {!hideApps && (
            <SidebarItem
              to={`${path}${ROUTES.APPLICATIONS}`}
              label="Applications"
              iconName="applications"
              disabled={disabled}
            />
          )}
          <SidebarItem
            to={`${path}${ROUTES.ALLOCATIONS}`}
            label="Allocations"
            iconName="allocations"
            disabled={disabled}
          />
          {!hideApps && (
            <SidebarItem
              to={`${path}${ROUTES.HISTORY}`}
              label="History"
              iconName="history"
              disabled={disabled}
            >
              <HistoryBadge unread={unread} disabled={disabled} />
            </SidebarItem>
          )}
          {showUIPatterns && (
            <SidebarItem
              to={`${path}${ROUTES.UI}`}
              label="UI Patterns"
              iconName="copy"
              disabled={disabled}
            />
          )}
        </>
      )}
      <NavItem styleName="feedback-nav-item">
        <FeedbackButton />
      </NavItem>
    </Nav>
  );
};

Sidebar.propTypes = {
  disabled: PropTypes.bool,
  showUIPatterns: PropTypes.bool,
  loading: PropTypes.bool
};

Sidebar.defaultProps = {
  disabled: false,
  showUIPatterns: false,
  loading: true
};

export default Sidebar;
