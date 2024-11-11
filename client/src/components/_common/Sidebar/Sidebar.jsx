import React from 'react';
import PropTypes from 'prop-types';
import { NavLink as RRNavLink } from 'react-router-dom';
import { Nav, NavItem, NavLink } from 'reactstrap';
import Icon from '_common/Icon';
import styles from './Sidebar.module.css';
import emptyStringValidator from '_common/CommonUtils';

const SidebarItem = ({ to, iconName, label, children, disabled, hidden }) => {
  return (
    <NavItem>
      <NavLink
        tag={RRNavLink}
        to={to}
        disabled={disabled}
        className={styles['link']}
        activeClassName={styles['link--active']}
      >
        <div
          className={`${disabled ? styles['disabled'] : ''} ${
            styles['content']
          } nav-content`}
        >
          {iconName && <Icon name={iconName} className={styles['icon']} />}
          <span className={styles['text']}>{label}</span>
          {children}
        </div>
      </NavLink>
    </NavItem>
  );
};
SidebarItem.propTypes = {
  to: PropTypes.string.isRequired,
  iconName: PropTypes.string.isRequired,
  label: emptyStringValidator,
  children: PropTypes.node,
  disabled: PropTypes.bool,
  hidden: PropTypes.bool,
};
SidebarItem.defaultProps = {
  children: null,
  disabled: false,
  hidden: false,
};

const Sidebar = ({
  sidebarItems,
  addItemsBefore,
  addItemsAfter,
  loading,
  isMain,
}) => {
  return (
    <Nav
      className={`nav-sidebar ${styles['root']} ${
        isMain ? styles['main'] : ''
      }`}
      vertical
    >
      {!loading && addItemsBefore
        ? addItemsBefore.map(
            (item) =>
              !item.hidden && (
                <NavItem className={item.className} key={item.className}>
                  {item.children}
                </NavItem>
              )
          )
        : null}

      {!loading &&
        sidebarItems.map(
          (item) =>
            !item.hidden && (
              <SidebarItem
                to={item.to}
                iconName={item.iconName}
                disabled={item.disabled}
                label={item.label}
                key={item.label}
              >
                {item.children}
              </SidebarItem>
            )
        )}

      {!loading && addItemsAfter
        ? addItemsAfter.map(
            (item) =>
              !item.hidden && (
                <NavItem className={item.className} key={item.className}>
                  {item.children}
                </NavItem>
              )
          )
        : null}
    </Nav>
  );
};

Sidebar.propTypes = {
  sidebarItems: PropTypes.arrayOf(PropTypes.object).isRequired,
  addItemsBefore: PropTypes.arrayOf(PropTypes.object),
  addItemsAfter: PropTypes.arrayOf(PropTypes.object),
  loading: PropTypes.bool,
  isMain: PropTypes.bool,
};
Sidebar.defaultProps = {
  addItemsBefore: [],
  addItemsAfter: [],
  loading: false,
  isMain: false,
};

export default Sidebar;
