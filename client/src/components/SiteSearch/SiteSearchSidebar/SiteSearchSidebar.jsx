import React from 'react';
import queryStringParser from 'query-string';
import { Nav, NavItem, NavLink } from 'reactstrap';
import PropTypes from 'prop-types';
import { useLocation, NavLink as RRNavLink } from 'react-router-dom';
import { Icon, Pill } from '_common';
import './SiteSearchSidebar.scss';
import { Sidebar } from '_common';

export const SiteSearchSidebarItem = ({
  to,
  label,
  icon,
  count,
  searching,
}) => {
  return (
    <NavItem>
      <NavLink tag={RRNavLink} to={to} activeClassName="active">
        <div className="nav-content">
          <Icon name={icon} />
          <span className="nav-text">{label}</span>
          <div
            className={`search-count-pill ${searching ? 'hidden' : ''}`}
            data-testid="count-pill"
          >
            <Pill>{count.toString()}</Pill>
          </div>
        </div>
      </NavLink>
    </NavItem>
  );
};

const SiteSearchSidebarItemPill = ({ count }) => {
  return (
    <div className={`search-count-pill`} data-testid="count-pill">
      <Pill>{count.toString()}</Pill>
    </div>
  );
};

const SiteSearchSidebar = ({ authenticated, schemes, results, searching }) => {
  const queryParams = queryStringParser.parse(useLocation().search);
  // Reset pagination on browse
  const query = queryStringParser.stringify({ ...queryParams, page: 1 });

  const sidebarItems = [
    {
      to: `/search/cms/?${query}`,
      label: 'Web Content',
      iconName: 'browser',
      disabled: false,
      hidden: false,
      children: <SiteSearchSidebarItemPill count={results.cms.count} />,
    },
    {
      to: `/search/public/?${query}`,
      label: 'Public Files',
      iconName: 'folder',
      disabled: false,
      hidden: !schemes.includes('public'),
      children: <SiteSearchSidebarItemPill count={results.public.count} />,
    },
    {
      to: `/search/community/?${query}`,
      label: 'Community Data',
      iconName: 'folder',
      disabled: false,
      hidden: !authenticated && !schemes.includes('community'),
      children: <SiteSearchSidebarItemPill count={results.community.count} />,
    },
  ];

  return (
    <>
      <Sidebar sidebarItems={sidebarItems} loading={searching} />
    </>
  );
};
SiteSearchSidebar.propTypes = {
  authenticated: PropTypes.bool.isRequired,
  results: PropTypes.objectOf(
    PropTypes.shape({
      count: PropTypes.number,
    })
  ).isRequired,
  schemes: PropTypes.arrayOf(PropTypes.string).isRequired,
  searching: PropTypes.bool.isRequired,
};

export default SiteSearchSidebar;
