import React, { useCallback, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
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
  const modalProps = useSelector((state) => state.files.modalProps[operation]);
  const findSystem = (id) =>
    systemList.find(
      (system) => `${system.system}${system.homeDir || ''}` === id
    );
  const [selectedSystem, setSelectedSystem] = useState(systemId);

  const openSystem = useCallback(
    (event) => {
      if (event.target.value === 'shared') {
        setSelectedSystem('shared');
        dispatch({
          type: 'DATA_FILES_SET_MODAL_PROPS',
          payload: {
            operation,
            props: { ...modalProps, showProjects: true },
          },
        });
        return;
      }

      const system = findSystem(event.target.value);
      setSelectedSystem(`${system.system}${system.homeDir || ''}`);
      dispatch({
        type: 'FETCH_FILES',
        payload: {
          ...system,
          path: system.homeDir || '',
          section,
        },
      });
      dispatch({
        type: 'DATA_FILES_SET_MODAL_PROPS',
        payload: {
          operation,
          props: { ...modalProps, showProjects: false },
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
        props: { ...modalProps, showProjects: true },
      },
    });
  };

  useEffect(() => {
    setSelectedSystem(systemId);
  }, []);

  const dropdownSystems = systemList.filter(
    (s) => !excludedSystems.includes(`${s.system}${s.homeDir || ''}`)
  );

  return (
    <>
      <DropdownSelector
        onChange={openSystem}
        value={selectedSystem}
        className={styles['system-select']}
        disabled={disabled || !dropdownSystems.length}
      >
        {dropdownSystems.map((s) => (
          <option
            key={s.name}
            value={
              s.scheme === 'projects'
                ? 'shared'
                : `${s.system}${s.homeDir || ''}`
            }
          >
            {s.name}
          </option>
        ))}
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
