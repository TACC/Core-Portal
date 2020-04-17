import React from 'react';
import { Nav, NavItem, NavLink } from 'reactstrap';
import { NavLink as RRNavLink, useRouteMatch } from 'react-router-dom';
import * as ROUTES from '../../constants/routes';
import styles from './Sidebar.scss';
import iconStyles from '../../styles/icon.css';

/** A navigation list for the application */
const Sidebar = () => {
  const { path } = useRouteMatch();
  return (
    <Nav className={styles.container} vertical>
      <NavItem>
        <NavLink
          tag={RRNavLink}
          exact
          to={`${path}${ROUTES.DASHBOARD}`}
          className={styles.link}
          activeClassName={styles.isActive}
        >
          <div className={styles.link__content}>
            <i
              className={`${styles.icon} ${iconStyles.icon} ${iconStyles['icon-nav-dashboard']}`}
            />
            <span className={styles.link__text}>Dashboard</span>
            <div className={styles['nav-content']}>
              <samp className={styles['side-nav-icon']}>Test</samp>
            </div>
          </div>
        </NavLink>
      </NavItem>
      <NavItem>
        <NavLink
          tag={RRNavLink}
          to={`${path}${ROUTES.DATA}`}
          className={styles.link}
          activeClassName={styles.isActive}
        >
          <div className={styles.link__content}>
            <i
              className={`${styles.icon} ${iconStyles.icon} ${iconStyles['icon-nav-folder']}`}
            />
            <span className={styles.link__text}>Data Files</span>
          </div>
        </NavLink>
      </NavItem>
      <NavItem>
        <NavLink
          tag={RRNavLink}
          to={`${path}${ROUTES.APPLICATIONS}`}
          className={styles.link}
          activeClassName={styles.isActive}
        >
          <div className={styles.link__content}>
            <i
              className={`${styles.icon} ${iconStyles.icon} ${iconStyles['icon-nav-application']}`}
            />
            <span className={styles.link__text}>Applications</span>
          </div>
        </NavLink>
      </NavItem>
      <NavItem>
        <NavLink
          tag={RRNavLink}
          to={`${path}${ROUTES.ALLOCATIONS}`}
          className={styles.link}
          activeClassName={styles.isActive}
        >
          <div className={styles.link__content}>
            <i
              className={`${styles.icon} ${iconStyles.icon} ${iconStyles['icon-nav-allocation']}`}
            />
            <span className={styles.link__text}>Allocations</span>
          </div>
        </NavLink>
      </NavItem>
    </Nav>
  );
};

export default Sidebar;
