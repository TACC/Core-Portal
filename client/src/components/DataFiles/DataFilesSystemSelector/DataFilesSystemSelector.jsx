import React, { useCallback, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid';
import { DropdownSelector } from '_common';
import styles from './DataFilesSystemSelector.module.scss';

const DataFilesSystemSelector = ({
  systemId,
  section,
  disabled,
  operation,
  showProjects,
  excludedSystems, // System names to exclude (as in cep.home.xxx).
}) => {
  const dispatch = useDispatch();
  const systemList = useSelector(
    (state) => state.systems.storage.configuration
  );
  const findSystem = (id) => systemList.find((system) => system.system === id);
  const [selectedSystem, setSelectedSystem] = useState(systemId);

  const openSystem = useCallback(
    (event) => {
      if (event.target.value === 'shared') {
        setSelectedSystem('shared');
        dispatch({
          type: 'DATA_FILES_SET_MODAL_PROPS',
          payload: {
            operation,
            props: { showProjects: true },
          },
        });
        return;
      }

      const system = findSystem(event.target.value);
      setSelectedSystem(system.system);
      dispatch({
        type: 'FETCH_FILES',
        payload: {
          ...system,
          section,
        },
      });
      dispatch({
        type: 'DATA_FILES_SET_MODAL_PROPS',
        payload: {
          operation,
          props: { showProjects: false },
        },
      });
    },
    [dispatch, section, findSystem, setSelectedSystem]
  );

  const resetProjects = () => {
    dispatch({
      type: 'DATA_FILES_SET_MODAL_PROPS',
      payload: {
        operation,
        props: { showProjects: true },
      },
    });
  };

  useEffect(() => {
    setSelectedSystem(systemId);
  }, []);

  return (
    <>
      <DropdownSelector
        onChange={openSystem}
        value={selectedSystem}
        className={styles['system-select']}
        disabled={disabled}
      >
        {systemList
          .filter(
            (s) =>
              s.scheme !== 'projects' && !excludedSystems.includes(s.system)
          )
          .map((system) => (
            <option key={uuidv4()} value={system.system}>
              {system.name}
            </option>
          ))}
        {systemList.find((s) => s.scheme === 'projects') ? (
          <option value="shared">Shared Workspaces</option>
        ) : (
          <></>
        )}
      </DropdownSelector>
      {selectedSystem === 'shared' && !showProjects && (
        <button
          type="button"
          className={`btn btn-link ${styles['btn-shared']}`}
          onClick={resetProjects}
        >
          Return to Shared Workspaces
        </button>
      )}
    </>
  );
};

DataFilesSystemSelector.propTypes = {
  systemId: PropTypes.string,
  section: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  operation: PropTypes.string.isRequired,
  showProjects: PropTypes.bool,
  excludedSystems: PropTypes.arrayOf(PropTypes.string),
};

DataFilesSystemSelector.defaultProps = {
  systemId: '',
  disabled: false,
  showProjects: false,
  excludedSystems: [],
};

export default DataFilesSystemSelector;
