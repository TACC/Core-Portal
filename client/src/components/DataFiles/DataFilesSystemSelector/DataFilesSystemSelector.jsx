import React, { useCallback, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { DropdownSelector } from '_common';
import styles from './DataFilesSystemSelector.module.scss';

const DataFilesSystemSelector = ({
  defaultSystemAndHomeDirPath,
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

  const availableSystems = systemList
    .map((s) => ({
      systemAndHomeDirPath:
        s.scheme === 'projects' ? 'shared' : `${s.system}${s.homeDir || ''}`,
      systemConf: s,
    }))
    .filter((s) => !excludedSystems.includes(s.systemAndHomeDirPath));

  const defaultSystem = availableSystems.reduce(
    (prev, s) =>
      s.systemAndHomeDirPath === defaultSystemAndHomeDirPath ? s : prev,
    availableSystems[0]
  );

  const [selectedDropdownSystem, setSelectedDropdownSystem] =
    useState(defaultSystem);

  useEffect(() => {
    if (selectedDropdownSystem.systemAndHomeDirPath === 'shared') {
      dispatch({
        type: 'DATA_FILES_SET_MODAL_PROPS',
        payload: {
          operation,
          props: { ...modalProps, showProjects: true },
        },
      });
      return;
    }

    dispatch({
      type: 'FETCH_FILES',
      payload: {
        ...selectedDropdownSystem.systemConf,
        path: selectedDropdownSystem.systemConf.homeDir || '',
        section,
      },
    });
    dispatch({
      type: 'FETCH_SYSTEM_DEFINITION',
      payload: selectedDropdownSystem.systemConf.system,
    });
    dispatch({
      type: 'DATA_FILES_SET_MODAL_PROPS',
      payload: {
        operation,
        props: { ...modalProps, showProjects: false },
      },
    });
  }, [selectedDropdownSystem]);

  const openSystem = useCallback(
    (event) => {
      const dropdownSystem = availableSystems.find(
        (s) => s.systemAndHomeDirPath === event.target.value
      );
      setSelectedDropdownSystem(dropdownSystem);
    },
    [dispatch, section, setSelectedDropdownSystem]
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

  return (
    <>
      <DropdownSelector
        onChange={openSystem}
        value={selectedDropdownSystem.systemAndHomeDirPath}
        className={styles['system-select']}
        disabled={disabled || !availableSystems.length}
      >
        {availableSystems.map((s) => (
          <option key={s.systemAndHomeDirPath} value={s.systemAndHomeDirPath}>
            {s.systemConf.name}
          </option>
        ))}
      </DropdownSelector>
      {selectedDropdownSystem.systemAndHomeDirPath === 'shared' &&
        !showProjects && (
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
  defaultSystemAndHomeDirPath: PropTypes.string,
  section: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  operation: PropTypes.string.isRequired,
  showProjects: PropTypes.bool,
  excludedSystems: PropTypes.arrayOf(PropTypes.string),
};

DataFilesSystemSelector.defaultProps = {
  defaultSystemAndHomeDirPath: '',
  disabled: false,
  showProjects: false,
  excludedSystems: [],
};

export default DataFilesSystemSelector;
