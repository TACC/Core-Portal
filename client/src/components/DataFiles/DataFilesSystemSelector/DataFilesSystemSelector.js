import React, { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid';
import './DataFilesSystemSelector.scss';

const DataFilesSystemSelector = ({ systemId, section }) => {
  const dispatch = useDispatch();
  const systems_list = useSelector(state => state.systems.systems_list);
  const findSystem = (systemId) => systems_list.find(system => system.system === systemId);
  const initialSystem = systemId ? findSystem(systemId) : systems_list[0];

  const openSystem = useCallback((event) => {
    let systemId = event.target.value;
    let system = findSystem(systemId);
    dispatch({
      type: 'FETCH_FILES',
      payload: {
        ...system,
        section
      }
    })
  }, [dispatch, section, findSystem, systems_list]);

  return (
    <>
      <select onChange={openSystem} defaultValue={initialSystem}>
        {
          systems_list.map(
            (system) => (
              <option 
                key={uuidv4()} 
                value={system.system}
              >
                {system.name}
              </option>
            )
          )
        }
      </select>
    </>
  );
};

DataFilesSystemSelector.propTypes = {
  systemId: PropTypes.string,
  section: PropTypes.string.isRequired
};

DataFilesSystemSelector.defaultProps = {
  systemId: null
}

export default React.memo(DataFilesSystemSelector);
