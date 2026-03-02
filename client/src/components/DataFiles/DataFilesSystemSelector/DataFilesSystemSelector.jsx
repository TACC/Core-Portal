import React, { useCallback, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { useSystems } from 'hooks/datafiles';
import { DropdownSelector } from '_common';
import styles from './DataFilesSystemSelector.module.scss';

const DataFilesSystemSelector = ({
  initialParams,
  section,
  disabled,
  operation,
  showProjects,
  excludedSystems, // System names to exclude (as in cep.home.xxx).
}) => {
  const dispatch = useDispatch();
  const modalProps = useSelector((state) => state.files.modalProps[operation]);

  const { data: systemList, fetchSelectedSystem } = useSystems();

  const dropdownSystems = systemList
    .map((s) => ({
      systemAndHomeDirPath:
        s.scheme === 'projects' && s.homeDir === undefined
          ? 'shared'
          : `${s.system}${s.homeDir || ''}`,
      systemConf: s,
    }))
    .filter((s) => !excludedSystems.includes(s.systemAndHomeDirPath));

  // Determine initial system selection for dropdown, derived from passed initialParams
  // from a file listing, and `state.systems.storage.configuration`
  let initialSystem, initialSystemAndHomeDirPath;
  if (initialParams.scheme === 'projects' && initialParams.path) {
    initialSystem = initialParams;
    initialSystemAndHomeDirPath = 'shared';
  } else {
    initialSystem = fetchSelectedSystem(initialParams);
    initialSystemAndHomeDirPath = `${initialSystem?.system}${initialSystem?.homeDir || ''}`;
  }

  // If the initial system is not in the dropdown options (e.g. because it's excluded),
  // default to the first option in the dropdown.
  const defaultSystem = dropdownSystems.reduce(
    (prev, s) =>
      s.systemAndHomeDirPath === initialSystemAndHomeDirPath
        ? { ...s, path: initialParams.path, systemConf: initialSystem } // Use the systemConf from the initial system if it matches, to preserve any additional metadata that may not be in the dropdown list, e.g. `system` for a project system id
        : prev,
    dropdownSystems[0]
  );

  const [selectedDropdownSystem, setSelectedDropdownSystem] =
    useState(defaultSystem);

  useEffect(() => {
    // Initialze modal with project root listing if selected system is of type 'shared', but has no path
    if (
      selectedDropdownSystem.systemAndHomeDirPath === 'shared' &&
      !selectedDropdownSystem.path
    ) {
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
        path:
          selectedDropdownSystem.path ||
          selectedDropdownSystem.systemConf.homeDir ||
          '',
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
      const dropdownSystem = dropdownSystems.find(
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
        disabled={disabled || !dropdownSystems.length}
      >
        {dropdownSystems.map((s) => (
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
  initialParams: PropTypes.shape({
    system: PropTypes.string.isRequired,
    scheme: PropTypes.string.isRequired,
    api: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired,
  }),
  section: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  operation: PropTypes.string.isRequired,
  showProjects: PropTypes.bool,
  excludedSystems: PropTypes.arrayOf(PropTypes.string),
};

DataFilesSystemSelector.defaultProps = {
  initialParams: {},
  disabled: false,
  showProjects: false,
  excludedSystems: [],
};

export default DataFilesSystemSelector;
