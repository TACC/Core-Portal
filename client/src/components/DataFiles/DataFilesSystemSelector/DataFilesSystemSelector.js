import React, { useCallback, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid';
import { DropdownSelector } from '_common';
import './DataFilesSystemSelector.module.scss';

const DataFilesSystemSelector = ({ systemId, section }) => {
  const dispatch = useDispatch();
  const systemList = useSelector(state => state.systems.systemList);
  const findSystem = id => systemList.find(system => system.system === id);
  const initialSystem = systemId ? findSystem(systemId) : systemList[0];
  const [ selectedSystem, setSelectedSystem ] = useState(initialSystem.system);

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

  return (
    <>
      {selectedSystem.system}
      <DropdownSelector
        onChange={openSystem}
        value={selectedSystem}
        styleName="system-select"
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
  section: PropTypes.string.isRequired
};

DataFilesSystemSelector.defaultProps = {
  systemId: null
};

export default React.memo(DataFilesSystemSelector);
