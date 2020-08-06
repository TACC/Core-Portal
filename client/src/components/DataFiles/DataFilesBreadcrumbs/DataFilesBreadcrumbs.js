import React from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import './DataFilesBreadcrumbs.scss';

const BreadcrumbLink = ({ api, scheme, system, path, children, section }) => {
  const onClick = e => {
    const dispatch = useDispatch();
    e.stopPropagation();
    e.preventDefault();
    dispatch({
      type: 'FETCH_FILES',
      payload: {
        api,
        scheme,
        system,
        path,
        section
      }
    });
  };

  switch (section) {
    case 'FilesListing':
      return (
        <Link
          className="breadcrumb-link"
          to={`/workbench/data/${api}/${scheme}/${system}${path}/`}
        >
          {children}
        </Link>
      );

    case 'modal':
      return (
        <span>
          <a
            className="breadcrumb-link"
            href={`/workbench/data/${api}/${scheme}/${system}${path}/`}
            onClick={onClick}
          >
            {children}
          </a>
        </span>
      );
    default:
      return <span>{children}</span>;
  }
};
BreadcrumbLink.propTypes = {
  api: PropTypes.string.isRequired,
  scheme: PropTypes.string.isRequired,
  system: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  section: PropTypes.string.isRequired,
  children: PropTypes.element.isRequired
};

const DataFilesBreadcrumbs = ({
  api,
  scheme,
  system,
  path,
  section,
  className
}) => {
  const paths = [];
  const pathComps = [];

  const sysName = system
    .split('.')[0]
    .replace(system.charAt(0), system.charAt(0).toUpperCase());
  path
    .split('/')
    .filter(x => x)
    .reduce((prev, curr) => {
      const comp = `${prev}/${curr}`;
      paths.push(comp);
      pathComps.push(curr);
      return comp;
    }, '');

  const root = (() => {
    switch (scheme) {
      case 'private':
        return `My Data (${sysName})`;
      case 'community':
        return 'Community Data';
      default:
        return null;
    }
  })();

  return (
    <div className={`breadcrumbs ${className}`}>
      <BreadcrumbLink
        api={api}
        scheme={scheme}
        system={system}
        path=""
        section={section}
      >
        <>{root}</>
      </BreadcrumbLink>
      {pathComps.map((pathComp, i) => {
        if (i < paths.length - 2) {
          return ' /... ';
        }
        if (i === paths.length - 1) {
          return <span key={uuidv4()}> / {pathComp}</span>;
        }
        return (
          <React.Fragment key={uuidv4()}>
            {' '}
            /{' '}
            <BreadcrumbLink
              api={api}
              scheme={scheme}
              system={system}
              path={paths[i]}
              section={section}
            >
              <>{pathComp}</>
            </BreadcrumbLink>
          </React.Fragment>
        );
      })}
    </div>
  );
};
DataFilesBreadcrumbs.propTypes = {
  api: PropTypes.string.isRequired,
  scheme: PropTypes.string.isRequired,
  system: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  section: PropTypes.string.isRequired,
  /** Additional className for the root element */
  className: PropTypes.string
};
DataFilesBreadcrumbs.defaultProps = {
  className: ''
};

export default DataFilesBreadcrumbs;
