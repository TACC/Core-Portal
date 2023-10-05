import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Button } from '_common';
import {
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  ButtonDropdown,
} from 'reactstrap';
import { useSystemDisplayName, useSystems } from 'hooks/datafiles';
import '../DataFilesBreadcrumbs/DataFilesBreadcrumbs.scss';

const BreadcrumbsDropdown = ({
  api,
  scheme,
  system,
  path,
  section,
  isPublic,
}) => {
  const paths = [];
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const handleNavigation = (targetPath) => {
    const basePath = isPublic ? '/public-data' : '/workbench/data';
    let url;

    if (scheme === 'projects' && !targetPath) {
      url = `${basePath}/${api}/projects/`;
    } else if (api === 'googledrive' && !targetPath) {
      url = `${basePath}/${api}/${scheme}/${system}/`;
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
  let currentPath = startingPath;

  pathComponents.slice(3).forEach((component) => {
    currentPath = `${currentPath}/${component}`;
    paths.push(currentPath);
  });

  const fullPath = paths.reverse();
  return (
    <div id="path-button-wrapper">
      <ButtonDropdown
        isOpen={dropdownOpen}
        toggle={toggleDropdown}
        id="go-to-button-dropdown"
        className="go-to-button-dropdown"
      >
        <DropdownToggle tag={Button}>Go to ...</DropdownToggle>
        <DropdownMenu>
          {fullPath.slice(1, fullPath.length).map((path, index) => {
            const folderName = path.split('/').pop();
            return (
              <Link key={index} to={handleNavigation(path)}>
                <DropdownItem>
                  <i className="icon-folder" />
                  {folderName.length > 20
                    ? folderName.substring(0, 20)
                    : folderName}
                </DropdownItem>
              </Link>
            );
          })}
          <DropdownItem divider />
          <Link className="link-hover" to={handleNavigation(homeDir)}>
            <DropdownItem className="complex-dropdown-item-root">
              <i className="icon-my-data" />
              <span className="multiline-menu-item-wrapper">
                {systemName || 'Shared Workspaces'}
                <small>Root</small>
              </span>
            </DropdownItem>
          </Link>
        </DropdownMenu>
      </ButtonDropdown>
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
