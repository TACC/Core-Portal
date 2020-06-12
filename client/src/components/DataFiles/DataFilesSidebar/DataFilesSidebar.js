import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Nav,
  NavItem,
  NavLink,
  ButtonDropdown,
  DropdownMenu,
  DropdownToggle,
  DropdownItem
} from 'reactstrap';

import { NavLink as RRNavLink, useRouteMatch } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDesktop } from '@fortawesome/free-solid-svg-icons';
import './DataFilesSidebar.scss';

const DataFilesSidebar = () => {
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
  const toggleMkdirModal = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'mkdir', props: {} }
    });
  };
  const match = useRouteMatch();
  return (
    <>
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
              <DropdownItem onClick={toggleMkdirModal}>
                <i className="icon-nav-folder" /> Folder
              </DropdownItem>
              <DropdownItem
                className="complex-dropdown-item"
                onClick={toggleUploadModal}
              >
                <i className="icon-action-upload" />
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
            <NavItem>
              <NavLink
                tag={RRNavLink}
                to={`${match.path}/tapis/private/`}
                activeClassName="active"
              >
                <span className="nav-content">
                  <FontAwesomeIcon
                    icon={faDesktop}
                    size="1x"
                    className="icon"
                  />
                  <span className="nav-text">My Data</span>
                </span>
              </NavLink>
            </NavItem>
          </Nav>
        </div>
      </div>
    </>
  );
};

export default DataFilesSidebar;
