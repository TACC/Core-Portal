import React, { useState } from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '_common';
import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from 'reactstrap';
import { useSystemDisplayName, useSystems } from 'hooks/datafiles';
import '../DataFilesBreadcrumbs/DataFilesBreadcrumbs.scss';

const BreadcrumbsDropdown = ({
  api,
  scheme,
  system,
  path,
  basePath,
  section,
  isPublic,
}) => {
  const paths = [];
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const location = useLocation();
  const pathParts = location.pathname.split('/');

  const projectId = pathParts.includes('projects')
    ? pathParts[pathParts.indexOf('projects') + 2]
    : null;

  const rootProjectSystem = pathParts.includes('projects')
    ? pathParts[pathParts.indexOf('projects') + 1]
    : null;

  const handleNavigation = (targetPath) => {
    if (!basePath) basePath = isPublic ? '/public-data' : '/workbench/data';
    let url;

    if (scheme === 'projects' && targetPath === systemName) {
      url = `${basePath}/${api}/projects/${rootProjectSystem}/${projectId}/`;
    } else if (scheme === 'projects' && !targetPath) {
      url = `${basePath}/${api}/projects/${rootProjectSystem}`;
    } else if (api === 'googledrive' && !targetPath) {
      url = `${basePath}/${api}/${scheme}/${system}/`;
    } else if (api === 'tapis' && scheme !== 'projects' && !targetPath) {
      url = `${basePath}/${api}/${scheme}/${system}/`;
    } else if (scheme === 'projects') {
      url = `${basePath}/${api}/projects/${rootProjectSystem}/${system}${targetPath}`;
    } else {
      url = `${basePath}/${api}/${scheme}/${system}${targetPath}/`;
    }

    return url;
  };

  const { fetchSelectedSystem } = useSystems();
  const selectedSystem = fetchSelectedSystem({ scheme, system, path });
  const systemName = useSystemDisplayName({ scheme, system, path });
  const homeDir = selectedSystem?.homeDir;
  const isSystemRootPath = !path
    .replace(/^\/+/, '')
    .startsWith(homeDir?.replace(/^\/+/, ''));
  const startingPath = isSystemRootPath ? '' : homeDir;

  const pathComponents = path.split('/').filter((x) => !!x);
  const startingPathComponents = startingPath.split('/').filter((x) => !!x);
  const overlapIndex = pathComponents.findIndex(
    (component, index) => startingPathComponents[index] !== component
  );
  const systems = useSelector(
    (state) => state.systems.storage.configuration.filter((s) => !s.hidden),
    shallowEqual
  );

  const sharedWorkspacesDisplayName = systems.find(
    (e) => e.scheme === 'projects' && e.system === rootProjectSystem
  )?.name;

  let currentPath = startingPath;
  pathComponents.slice(overlapIndex).forEach((component) => {
    currentPath = `${currentPath}/${component}`;
    paths.push(currentPath);
  });

  const fullPath = paths.reverse();
  const displayPaths =
    scheme === 'projects' ? [...fullPath, systemName] : fullPath;
  const sliceStart = 1;
  return (
    <div id="path-button-wrapper">
      <Dropdown
        isOpen={dropdownOpen}
        toggle={toggleDropdown}
        className="go-to-button-dropdown"
      >
        <DropdownToggle tag={Button}>Go to ...</DropdownToggle>
        <DropdownMenu>
          {displayPaths
            .slice(sliceStart, displayPaths.length)
            .map((path, index) => {
              const folderName = path.split('/').pop();
              return (
                <Link
                  className="link-hover"
                  key={index}
                  to={handleNavigation(path)}
                >
                  <DropdownItem
                    className={
                      scheme === 'projects' && path === systemName
                        ? 'complex-dropdown-item-project'
                        : ''
                    }
                  >
                    <i className="icon-folder" />
                    <span
                      className={
                        scheme === 'projects' && path === systemName
                          ? 'multiline-menu-item-wrapper'
                          : ''
                      }
                    >
                      {folderName.length > 20
                        ? folderName.substring(0, 20)
                        : folderName}
                      {scheme === 'projects' && path === systemName && (
                        <small> Project Name </small>
                      )}
                    </span>
                  </DropdownItem>
                </Link>
              );
            })}
          <DropdownItem divider />
          <Link className="link-hover" to={handleNavigation(homeDir)}>
            <DropdownItem className="complex-dropdown-item-root">
              <i className="icon-my-data" />
              <span className="multiline-menu-item-wrapper">
                {scheme === 'projects'
                  ? sharedWorkspacesDisplayName
                  : systemName || sharedWorkspacesDisplayName}
                {homeDir ? <small>Root</small> : null}
              </span>
            </DropdownItem>
          </Link>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
};

BreadcrumbsDropdown.propTypes = {
  api: PropTypes.string.isRequired,
  scheme: PropTypes.string.isRequired,
  system: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  section: PropTypes.string,
  isPublic: PropTypes.bool,
};

BreadcrumbsDropdown.defaultProps = {
  isPublic: false,
};

export default BreadcrumbsDropdown;
