import React from 'react';
import PropTypes from 'prop-types';
import * as ROUTES from '../../../constants/routes';
import { Link } from 'react-router-dom';

export default function CMSBreadcrumbs({ breadcrumbs = [] }) {
  // Default breadcrumbs if none provided (maintains backward compatibility)
  const defaultBreadcrumbs = [
    { name: "Browse Datasets", href: ROUTES.PUBLICATIONS }
  ];

  const crumbsToRender = breadcrumbs.length > 0 ? breadcrumbs : defaultBreadcrumbs;

  return (
    <>
      <nav className="s-breadcrumbs" id="cms-breadcrumbs">
        <ol itemScope itemType="https://schema.org/BreadcrumbList">
          {crumbsToRender.map((crumb, index) => (
            <li
              key={index}
              itemScope
              itemProp="itemListElement"
              itemType="https://schema.org/ListItem"
            >
              {crumb.href ? (
                <Link to={crumb.href} itemProp="item">
                  <span itemProp="name">{crumb.name}</span>
                </Link>
              ) : (
                <span itemProp="name">{crumb.name}</span>
              )}
              <meta itemProp="position" content={index + 1} />
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

CMSBreadcrumbs.propTypes = {
  breadcrumbs: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      href: PropTypes.string,
    })
  ),
};
