import React, { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import {
  ButtonDropdown,
  DropdownMenu,
  DropdownToggle,
  DropdownItem
} from 'reactstrap';
import { v4 as uuidv4 } from 'uuid';
import './DataFilesSystemSelector.scss';

const DataFilesSystemSelector = ({ systemId, onSelect }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);
  const systems_list = useSelector(state => state.systems.systems_list);
  const initialSystem = systemId ? systems_list.find(system => system.system === systemId) : systems_list[0];
  const [selectedSystem, setSelectedSystem] = useState(initialSystem);

  const openSystem = useCallback((system) => {
    setSelectedSystem(system);
    setDropdownOpen(false);
    onSelect(system);
  }, []);

  return (
    <>
      <ButtonDropdown isOpen={dropdownOpen} toggle={toggleDropdown}>
        <DropdownToggle
          color="primary"
          id="data-files-select-system"
          className="data-files-btn"
        >
          { selectedSystem ? selectedSystem.name : '' }
        </DropdownToggle>
        <DropdownMenu>
          {
            systems_list.map(
              (system) => (
                <DropdownItem key={uuidv4()} onClick={() => openSystem(system)}>
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

DataFilesSystemSelector.propTypes = {
  systemId: PropTypes.string,
  onSelect: PropTypes.func.isRequired
};

DataFilesSystemSelector.defaultProps = {
  systemId: null
}

export default React.memo(DataFilesSystemSelector);
