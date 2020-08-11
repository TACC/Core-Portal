import React, { useCallback, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid';
import { DropdownSelector } from '_common';
import './DataFilesSystemSelector.module.scss';

const DataFilesSystemSelector = ({ systemId, section, disabled }) => {
  const dispatch = useDispatch();
  const systemList = useSelector(state => state.systems.systemList);
  const findSystem = id => systemList.find(system => system.system === id);
  const [selectedSystem, setSelectedSystem] = useState(systemId);

  const openSystem = useCallback(
    event => {
      const system = findSystem(event.target.value);
      setSelectedSystem(system.system);
      dispatch({
        type: 'FETCH_FILES',
        payload: {
          ...system,
          section
        }
      });
    },
    [dispatch, section, findSystem, setSelectedSystem]
  );

  useEffect(() => {
    setSelectedSystem(systemId);
  });

  return (
    <>
      <DropdownSelector
        onChange={openSystem}
        value={selectedSystem}
        styleName="system-select"
        disabled={disabled}
      >
        {systemList.map(system => (
          <option key={uuidv4()} value={system.system}>
            {system.name}
          </option>
        ))}
      </DropdownSelector>
    </>
  );
};

DataFilesSystemSelector.propTypes = {
  systemId: PropTypes.string,
  section: PropTypes.string.isRequired,
  disabled: PropTypes.bool
};

DataFilesSystemSelector.defaultProps = {
  systemId: null,
  disabled: false
};

export default DataFilesSystemSelector;
