import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  DropdownMenu,
  DropdownToggle,
  DropdownItem
} from 'reactstrap';
import './DataFilesSystemSelector.scss';

const DataFilesSidebar = (system, onSelect) => {
  const dispatch = useDispatch();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState(system);
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);
  const systems_list = useSelector(state => state.systems.systems_list);
  const openSystem = (system) => {
    onSelect(system.system);
    setDropdownOpen(false);
  }

  return (
    <>
      <ButtonDropdown isOpen={dropdownOpen} toggle={toggleDropdown}>
        <DropdownToggle
          color="primary"
          id="data-files-select-system"
          className="data-files-btn"
        >
          { selectedSystem }
        </DropdownToggle>
        <DropdownMenu>
          {
            systems_list.map(
              (system) => (
                <DropdownItem onClick={openSystem(system)}>
                  {system.name}
                </DropdownItem>
              )
            )
          }
        </DropdownMenu>
      </ButtonDropdown>
    </>
  );
};

export default DataFilesSidebar;
