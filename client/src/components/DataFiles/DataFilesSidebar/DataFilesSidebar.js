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
  DropdownItem
} from 'reactstrap';
import './DataFilesSidebar.module.scss';

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
      payload: { operation: 'upload', props: {} }
    });
  };
  const err = useSelector(state => state.files.error.FilesListing);
  const { api, scheme } = useSelector(state => state.files.params.FilesListing);
  const systems = useSelector(
    state => state.systems.storage.configuration,
    shallowEqual
  );
  const { user } = useSelector(state => state.authenticatedUser);

  const sharedWorkspaces = systems.find(e => e.name === 'Shared Workspaces');

  const toggleMkdirModal = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'mkdir', props: {} }
    });
  };

  const toggleAddProjectModal = () => {
    dispatch({
      type: 'USERS_CLEAR_SEARCH'
    });
    dispatch({
      type: 'PROJECTS_CLEAR_OPERATION'
    });
    dispatch({
      type: 'PROJECTS_MEMBER_LIST_SET',
      payload: [{ user, access: 'owner' }]
    });
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'addproject', props: {} }
    });
  };

  const writeItemStyle = readOnly ? 'read-only' : '';

  const match = useRouteMatch();

  const disabled =
    readOnly ||
    err !== false ||
    api !== 'tapis' ||
    (scheme !== 'private' && scheme !== 'projects');

  return (
    <div styleName="root">
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
              <DropdownItem onClick={toggleMkdirModal} disabled={disabled}>
                <span styleName={writeItemStyle}>
                  <i className="icon-folder" /> Folder
                </span>
              </DropdownItem>
              {systems.some(s => s.scheme === 'projects') &&
                !!(sharedWorkspaces && !sharedWorkspaces.read_only) && (
                  <DropdownItem onClick={toggleAddProjectModal}>
                    <i className="icon-folder" /> Shared Workspace
                  </DropdownItem>
                )}
              <DropdownItem
                className="complex-dropdown-item"
                onClick={toggleUploadModal}
                disabled={disabled}
              >
                <i className="icon-upload" styleName={writeItemStyle} />
                <span className="multiline-menu-item-wrapper">
                  <span styleName={writeItemStyle}>Upload</span>
                  <small styleName={writeItemStyle}> Up to 500mb </small>
                </span>
              </DropdownItem>
            </DropdownMenu>
          </ButtonDropdown>
        </div>
        <div className="data-files-nav">
          <Nav vertical>
            {systems
              ? systems.map(sys => (
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
  readOnly: PropTypes.bool
};

DataFilesSidebar.defaultProps = {
  readOnly: false
};

export default DataFilesSidebar;
