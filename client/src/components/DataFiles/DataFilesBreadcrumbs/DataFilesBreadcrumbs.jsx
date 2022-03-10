import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import './DataFilesBreadcrumbs.scss';
import {
  useSystemDisplayName,
  useFileListing,
  useModal
} from 'hooks/datafiles';

const BreadcrumbLink = ({
  api,
  scheme,
  system,
  path,
  children,
  section,
  isPublic,
}) => {
  const { fetchListing } = useFileListing(section);
  const onClick = e => {
    e.stopPropagation();
    e.preventDefault();
    fetchListing({
      api,
      scheme,
      system,
      path
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
  isPublic: PropTypes.bool,
};
BreadcrumbLink.defaultProps = {
  isPublic: false,
};

const RootProjectsLink = ({ api, section, operation, label }) => {
  const { setProps } = useModal();
  if (section === 'modal') {
    const onClick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      setProps({
        operation,
        props: { showProjects: true }
      });
    };
    return (
      <span>
        <a
          className="breadcrumb-link"
          href={`/workbench/data/${api}/projects/`}
          onClick={onClick}
        >
          {label}
        </a>
      </span>
    );
  }
  return (
    <Link className="breadcrumb-link" to={`/workbench/data/${api}/projects/`}>
      {label}
    </Link>
  );
};
RootProjectsLink.propTypes = {
  api: PropTypes.string.isRequired,
  section: PropTypes.string.isRequired,
  operation: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
};

const DataFilesBreadcrumbs = ({
  api,
  scheme,
  system,
  path,
  section,
  operation,
  isPublic,
  className,
}) => {
  const paths = [];
  const pathComps = [];

  path
    .split('/')
    .filter(x => !!x)
    .reduce((prev, curr) => {
      const comp = `${prev}/${curr}`;
      paths.push(comp);
      pathComps.push(curr);
      return comp;
    }, '');
  const root = useSystemDisplayName({ scheme, system });

  return (
    <div className={`breadcrumbs ${className}`}>
      {scheme === 'projects' && (
        <>
          <RootProjectsLink
            api={api}
            section={section}
            operation={operation}
            label="Shared Workspaces"
          />{' '}
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
  operation: PropTypes.string,
  isPublic: PropTypes.bool,
  /** Additional className for the root element */
  className: PropTypes.string,
};
DataFilesBreadcrumbs.defaultProps = {
  isPublic: false,
  className: '',
  operation: 'select',
};

export default DataFilesBreadcrumbs;
