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

const SidebarItem = ({ to, iconName, children, disabled }) => {
  return (
    <NavItem>
      <NavLink
        tag={RRNavLink}
        to={to}
        disabled={disabled}
        className={styles['link']}
        activeClassName={styles['link--active']}
      >
        <div className={`${disabled && styles['disabled']}`}>
          <Icon name={iconName} />
          <span className={styles['text']}>{children}</span>
        </div>
      </NavLink>
    </NavItem>
  );
};
SidebarItem.propTypes = {
  to: PropTypes.string.isRequired,
  iconName: PropTypes.string.isRequired,
  children: isNotEmptyString,
  disabled: PropTypes.bool,
};
SidebarItem.defaultProps = {
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
          key={item.children}
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
