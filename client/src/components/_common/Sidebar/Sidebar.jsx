import React from 'react';
import PropTypes from 'prop-types';
import { NavLink as RRNavLink } from 'react-router-dom';
import { Nav, NavItem, NavLink } from 'reactstrap';
import Icon from '_common/Icon';
import styles from './Sidebar.module.css';

function isNotEmptyString(props, propName, componentName) {
  if (!props[propName] || props[propName].replace(/ /g, '') === '') {
    return new Error(`No text passed to ${componentName}. Validation failed.`);
  }
  return null;
}

const SidebarItem = ({ to, iconName, label, children, disabled }) => {
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
          <Icon name={iconName} />
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
  label: isNotEmptyString,
  children: PropTypes.node,
  disabled: PropTypes.bool,
};
SidebarItem.defaultProps = {
  children: null,
  disabled: false,
};

const Sidebar = ({ sidebarItems }) => {
  return (
    <Nav className={styles['root']} vertical>
      {sidebarItems.map((item) => (
        <SidebarItem
          to={item.to}
          iconName={item.iconName}
          disabled={item.disabled}
          label={item.label}
          key={item.label}
        >
          {item.children}
        </SidebarItem>
      ))}
    </Nav>
  );
};
Sidebar.propTypes = {
  sidebarItems: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default Sidebar;
