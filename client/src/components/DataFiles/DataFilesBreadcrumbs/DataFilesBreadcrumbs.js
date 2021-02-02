import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import './DataFilesBreadcrumbs.scss';
import { findSystemOrProjectDisplayName } from 'utils/systems';

const BreadcrumbLink = ({
  api,
  scheme,
  system,
  path,
  children,
  section,
  isPublic
}) => {
  const dispatch = useDispatch();
  const onClick = e => {
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
  const basePath = isPublic ? '/public-data' : '/workbench/data';
  switch (section) {
    case 'FilesListing':
      return (
        <Link
          className="breadcrumb-link"
          to={`${basePath}/${api}/${scheme}/${system}${path}/`}
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
  children: PropTypes.element.isRequired,
  isPublic: PropTypes.bool
};
BreadcrumbLink.defaultProps = {
  isPublic: false
};

const DataFilesBreadcrumbs = ({
  api,
  scheme,
  system,
  path,
  section,
  isPublic,
  className
}) => {
  const paths = [];
  const pathComps = [];
  const systemList = useSelector(state => state.systems.storage.configuration);
  const projectsList = useSelector(state => state.projects.listing.projects);
  const projectTitle = useSelector(state => state.projects.metadata.title);

  path
    .split('/')
    .filter(x => x)
    .reduce((prev, curr) => {
      const comp = `${prev}/${curr}`;
      paths.push(comp);
      pathComps.push(curr);
      return comp;
    }, '');

  const root = findSystemOrProjectDisplayName(
    scheme,
    systemList,
    projectsList,
    system,
    projectTitle
  );

  return (
    <div className={`breadcrumbs ${className}`}>
      {scheme === 'projects' && (
        <>
          <Link
            className="breadcrumb-link"
            to={`/workbench/data/${api}/${scheme}/`}
          >
            Shared Workspaces
          </Link>{' '}
          {system && `/ `}
        </>
      )}
      <BreadcrumbLink
        api={api}
        scheme={scheme}
        system={system}
        path=""
        section={section}
        isPublic={isPublic}
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
  isPublic: PropTypes.bool,
  /** Additional className for the root element */
  className: PropTypes.string
};
DataFilesBreadcrumbs.defaultProps = {
  isPublic: false,
  className: ''
};

export default DataFilesBreadcrumbs;
