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
  const systems = useSelector(state => state.systems.systemList, shallowEqual);
  const { user } = useSelector(state => state.authenticatedUser);

  const toggleMkdirModal = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'mkdir', props: {} }
    });
  };

  const toggleAddProjectModal = () => {
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
  return (
    <div styleName="root">
      <div className="data-files-sidebar">
        <div id="add-button-wrapper">
          <ButtonDropdown isOpen={dropdownOpen} toggle={toggleDropdown}>
            <DropdownToggle
              color="primary"
              id="data-files-add"
              className="data-files-btn"
              disabled={err !== false}
            >
              + Add
            </DropdownToggle>
            <DropdownMenu>
              <DropdownItem onClick={toggleMkdirModal} disabled={readOnly}>
                <span styleName={writeItemStyle}>
                  <i className="icon-folder" /> Folder
                </span>
              </DropdownItem>
              {systems.some(s => s.scheme === 'projects') && (
                <DropdownItem onClick={toggleAddProjectModal}>
                  <i className="icon-folder" /> Shared Workspace
                </DropdownItem>
              )}
              <DropdownItem
                className="complex-dropdown-item"
                onClick={toggleUploadModal}
                disabled={readOnly}
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
                  <NavItem>
                    <NavLink
                      tag={RRNavLink}
                      to={`${match.path}/${sys.api}/${sys.scheme}/${
                        sys.system ? `${sys.system}/` : ''
                      }`}
                      activeClassName="active"
                      key={`${sys.name}`}
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
