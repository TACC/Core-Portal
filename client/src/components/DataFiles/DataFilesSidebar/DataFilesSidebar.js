import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
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
import { faDesktop, faFileUpload } from '@fortawesome/free-solid-svg-icons';
import { faFolder } from '@fortawesome/free-regular-svg-icons';
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
            <DropdownToggle id="data-files-add">+ Add</DropdownToggle>
            <DropdownMenu>
              <DropdownItem onClick={toggleMkdirModal}>
                <FontAwesomeIcon
                  icon={faFolder}
                  size="1x"
                  className="side-nav-icon"
                />{' '}
                Add Folder
              </DropdownItem>
              <DropdownItem onClick={toggleUploadModal}>
                <FontAwesomeIcon
                  icon={faFileUpload}
                  size="1x"
                  className="side-nav-icon"
                />{' '}
                Upload File
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
                <div className="nav-content">
                  <FontAwesomeIcon
                    icon={faDesktop}
                    size="1x"
                    className="side-nav-icon"
                  />
                  <span className="nav-text">My Data</span>
                </div>
              </NavLink>
            </NavItem>
          </Nav>
        </div>
      </div>
    </>
  );
};

export default DataFilesSidebar;
