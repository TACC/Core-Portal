import React from 'react';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Button } from '_common';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import './DataFilesBreadcrumbs.scss';
import '../DataFilesModals/DataFilesShowPathModal.jsx';
import {
  useSystemDisplayName,
  useFileListing,
  useModal,
  useSystems,
} from 'hooks/datafiles';
import truncateMiddle from 'utils/truncateMiddle';

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
  const onClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    fetchListing({
      api,
      scheme,
      system,
      path,
    });
  };
  const basePath = isPublic ? '/public-data' : '/workbench/data';
  switch (section) {
    case 'FilesListing':
      return (
        <Link
          className="breadcrumb-link truncate"
          to={`${basePath}/${api}/${scheme}/${system}${path}/`}
        >
          {children}
        </Link>
      );

    case 'modal':
      return (
        <span>
          <a
            className="breadcrumb-link truncate"
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
        props: { showProjects: true },
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

  const dispatch = useDispatch();

  const fileData = {
    system: system,
    path: path,
  };

  const openFullPathModal = (e) => {
    e.stopPropagation();
    e.preventDefault();
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'showpath', props: { file: fileData } },
    });
  };

  const { fetchSelectedSystem } = useSystems();

  const selectedSystem = fetchSelectedSystem({ scheme, system, path });

  const systemName = useSystemDisplayName({ scheme, system, path });

  const homeDir = selectedSystem?.homeDir;

  const isSystemRootPath = !path
    .replace(/^\/+/, '')
    .startsWith(homeDir?.replace(/^\/+/, ''));

  const startingPath = isSystemRootPath ? '' : homeDir;

  const systemHomeDirPaths = homeDir?.split('/').filter((x) => !!x);

  path
    .split('/')
    .filter((x) => !!x)
    .reduce((prev, curr, index) => {
      // don't push path if already part of the system's homeDir at the same index
      if (
        isSystemRootPath ||
        !systemHomeDirPaths ||
        systemHomeDirPaths[index] !== curr
      ) {
        const comp = `${prev}/${curr}`;
        paths.push(`${startingPath}${comp}`);
        pathComps.push(curr);
        return comp;
      } else {
        return '';
      }
    }, '');

  const fullPath = paths.slice(-1);
  const currentDirectory = pathComps.slice(-1);

  return (
    <div className="breadcrumb-container">
      <div className={`breadcrumbs ${className}`}>
        {currentDirectory.length === 0 ? (
          <span className="system-name">
            {truncateMiddle(systemName || 'Shared Workspaces', 30)}
          </span>
        ) : (
          currentDirectory.map((pathComp, i) => {
            if (i === fullPath.length - 1) {
              return <span key={uuidv4()}>{truncateMiddle(pathComp, 30)}</span>;
            }
          })
        )}
      </div>
      {systemName && api === 'tapis' && (
        <Button
          type="link"
          onClick={openFullPathModal}
        >
          View Full Path
        </Button>
      )}
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
