import React from 'react';
import queryStringParser from 'query-string';
import { Nav, NavItem, NavLink } from 'reactstrap';
import PropTypes from 'prop-types';
import { useLocation, NavLink as RRNavLink } from 'react-router-dom';
import { Icon, Pill } from '_common';
import './SiteSearchSidebar.scss';

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

const SiteSearchSidebar = ({ authenticated, schemes, results, searching }) => {
  const queryParams = queryStringParser.parse(useLocation().search);
  // Reset pagination on browse
  const query = queryStringParser.stringify({ ...queryParams, page: 1 });
  return (
    <>
      <div className="site-search-sidebar">
        <div className="site-search-nav">
          <Nav vertical>
            <SiteSearchSidebarItem
              to={`/search/cms/?${query}`}
              label="Web Content"
              icon="browser"
              count={results.cms.count}
              searching={searching}
            />
            {schemes.includes('public') && (
              <SiteSearchSidebarItem
                to={`/search/public/?${query}`}
                label="Public Files"
                icon="folder"
                count={results.public.count}
                searching={searching}
              />
            )}
            {authenticated && schemes.includes('community') && (
              <SiteSearchSidebarItem
                to={`/search/community/?${query}`}
                label="Community Data"
                icon="folder"
                count={results.community.count}
                searching={searching}
              />
            )}
          </Nav>
        </div>
      </div>
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
