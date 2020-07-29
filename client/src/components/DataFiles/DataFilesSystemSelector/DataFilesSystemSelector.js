import React, { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid';
import './DataFilesSystemSelector.scss';

const DataFilesSystemSelector = ({ systemId, section }) => {
  const dispatch = useDispatch();
  const systemsList = useSelector(state => state.systems.systemsList);
  const findSystem = id => systemsList.find(system => system.system === id);
  const initialSystem = systemId ? findSystem(systemId) : systemsList[0];

  const openSystem = useCallback(
    event => {
      const system = findSystem(event.target.value);
      dispatch({
        type: 'FETCH_FILES',
        payload: {
          ...system,
          section
        }
      });
    },
    [dispatch, section, findSystem, systemsList]
  );

  return (
    <>
      <select onChange={openSystem} defaultValue={initialSystem}>
        {systemsList.map(system => (
          <option key={uuidv4()} value={system.system}>
            {system.name}
          </option>
        ))}
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
};

export default React.memo(DataFilesSystemSelector);
