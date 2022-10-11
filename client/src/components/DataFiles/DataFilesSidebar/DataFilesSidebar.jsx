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

import { NavLink as RRNavLink, useRouteMatch } from 'react-router-dom';
import { Icon } from '_common';
import './DataFilesSidebar.scss';

const DataFilesSidebar = ({ readOnly }) => {
  const dispatch = useDispatch();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);
  const toggleUploadModal = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'upload', props: {} },
    });
  };
  const err = useSelector((state) => state.files.error.FilesListing);
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

  const match = useRouteMatch();

  const disabled =
    readOnly ||
    err !== false ||
    api !== 'tapis' ||
    (scheme !== 'private' && scheme !== 'projects');

  const writeItemStyle = disabled ? 'read-only' : '';
  return (
    <div className={styles['root']}>
      <div className="data-files-sidebar">
        <div id="add-button-wrapper">
          <ButtonDropdown isOpen={dropdownOpen} toggle={toggleDropdown}>
            <DropdownToggle
              color="primary"
              id="data-files-add"
              className="data-files-btn"
            >
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
        <div className="data-files-nav">
          <Nav vertical>
            {systems
              ? systems.map((sys) => (
                  <NavItem key={`${sys.name}`}>
                    <NavLink
                      tag={RRNavLink}
                      to={`${match.path}/${sys.api}/${sys.scheme}/${
                        sys.system ? `${sys.system}/` : ''
                      }`}
                      activeClassName="active"
                    >
                      <div className="nav-content">
                        <Icon name={sys.icon || 'my-data'} />
                        <span className="nav-text">{sys.name}</span>
                      </div>
                    </NavLink>
                  </NavItem>
                ))
              : null}
          </Nav>
        </div>
      </div>
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
