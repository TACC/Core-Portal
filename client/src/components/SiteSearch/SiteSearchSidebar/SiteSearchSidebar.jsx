import React from 'react';
import queryStringParser from 'query-string';
import { Nav, NavItem, NavLink } from 'reactstrap';
import PropTypes from 'prop-types';
import { useLocation, NavLink as RRNavLink } from 'react-router-dom';
import { Icon, Pill } from '_common';
import './SiteSearchSidebar.scss';

const SiteSearchSidebar = ({ authenticated, schemes, results }) => {
  const queryParams = queryStringParser.parse(useLocation().search);
  // Reset pagination on browse
  const query = queryStringParser.stringify({ ...queryParams, page: 1 });
  return (
    <>
      <div className="site-search-sidebar">
        <div className="site-search-nav">
          <Nav vertical>
            <NavItem>
              <NavLink
                tag={RRNavLink}
                to={`/search/cms/?${query}`}
                activeClassName="active"
              >
                <div className="nav-content">
                  <Icon name="browser" />
                  <span className="nav-text">Web Content </span>
                  <div className="search-count-pill">
                    <Pill>{results.cms.count.toString()}</Pill>
                  </div>
                </div>
              </NavLink>
              {schemes.includes('public') && (
                <NavLink
                  tag={RRNavLink}
                  to={`/search/public/?${query}`}
                  activeClassName="active"
                >
                  <div className="nav-content">
                    <Icon name="folder" />
                    <span className="nav-text">Public Files</span>
                    <div className="search-count-pill">
                      <Pill>{results.public.count.toString()}</Pill>
                    </div>
                  </div>
                </NavLink>
              )}
              {authenticated && schemes.includes('community') && (
                <NavLink
                  tag={RRNavLink}
                  to={`/search/community/?${query}`}
                  activeClassName="active"
                >
                  <div className="nav-content">
                    <Icon name="folder" />
                    <span className="nav-text">Community Data</span>
                    <div className="search-count-pill">
                      <Pill>{results.community.count.toString()}</Pill>
                    </div>
                  </div>
                </NavLink>
              )}
            </NavItem>
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
      count: PropTypes.number
    })
  ).isRequired,
  schemes: PropTypes.arrayOf(PropTypes.string).isRequired
};

export default SiteSearchSidebar;
