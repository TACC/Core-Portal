import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import {
  Nav,
  NavItem,
  NavLink,
  ButtonDropdown,
  DropdownMenu,
  DropdownToggle,
  DropdownItem,
} from 'reactstrap';
import styles from './DataFilesSidebar.module.scss';
import { Sidebar } from '_common';

import { NavLink as RRNavLink, useRouteMatch } from 'react-router-dom';
import { Icon } from '_common';
import './DataFilesSidebar.scss';

const DataFilesAddButton = ({ readOnly }) => {
  const dispatch = useDispatch();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);
  const toggleUploadModal = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'upload', props: {} },
    });
  };
  const hasError = useSelector((state) => state.files.error.FilesListing);
  const { api, scheme } = useSelector(
    (state) => state.files.params.FilesListing
  );
  const systems = useSelector(
    (state) => state.systems.storage.configuration.filter((s) => !s.hidden),
    shallowEqual
  );

  const sharedWorkspaces = systems.find((e) => e.scheme === 'projects');

  const toggleMkdirModal = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'mkdir', props: {} },
    });
  };

  const toggleAddProjectModal = () => {
    dispatch({
      type: 'USERS_CLEAR_SEARCH',
    });
    dispatch({
      type: 'PROJECTS_CLEAR_OPERATION',
    });
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'addproject', props: {} },
    });
  };

  const disabled =
    readOnly ||
    hasError !== false ||
    api !== 'tapis' ||
    (scheme !== 'private' && scheme !== 'projects');

  const writeItemStyle = disabled ? 'read-only' : '';

  return (
    <div id="add-button-wrapper">
      <ButtonDropdown isOpen={dropdownOpen} toggle={toggleDropdown}>
        <DropdownToggle color="primary" id="data-files-add">
          + Add
        </DropdownToggle>
        <DropdownMenu>
          <DropdownItem
            className={styles[writeItemStyle]}
            onClick={toggleMkdirModal}
            disabled={disabled}
          >
            <i className="icon-folder" /> Folder
          </DropdownItem>
          {sharedWorkspaces && !sharedWorkspaces.readOnly && (
            <DropdownItem onClick={toggleAddProjectModal}>
              <i className="icon-folder" /> Shared Workspace
            </DropdownItem>
          )}
          <DropdownItem
            className={`complex-dropdown-item ${styles[writeItemStyle]}`}
            onClick={toggleUploadModal}
            disabled={disabled}
          >
            <i className={`icon-upload`} />
            <span className="multiline-menu-item-wrapper">
              Upload
              <small> Up to 500mb </small>
            </span>
          </DropdownItem>
        </DropdownMenu>
      </ButtonDropdown>
    </div>
  );
};

const DataFilesSidebar = ({ readOnly }) => {
  const systems = useSelector(
    (state) => state.systems.storage.configuration.filter((s) => !s.hidden),
    shallowEqual
  );

  const match = useRouteMatch();

  var sidebarItems = [];

  systems.forEach((sys) => {
    sidebarItems.push({
      to: `${match.path}/${sys.api}/${sys.scheme}/${
        sys.system ? `${sys.system}${sys.homeDir || ''}/` : ''
      }`,
      label: sys.name,
      iconName: sys.icon || 'my-data',
      disabled: false,
      hidden: false,
    });
  });

  const addItems = [
    {
      className: styles['add-button-item'],
      children: <DataFilesAddButton readOnly={readOnly} />,
    },
  ];

  return (
    <div className={`nav-sidebar data-files-sidebar ${styles['root']}`}>
      <Sidebar sidebarItems={sidebarItems} addItemsBefore={addItems} />
    </div>
  );
};

DataFilesSidebar.propTypes = {
  readOnly: PropTypes.bool,
};

DataFilesSidebar.defaultProps = {
  readOnly: false,
};

export default DataFilesSidebar;
