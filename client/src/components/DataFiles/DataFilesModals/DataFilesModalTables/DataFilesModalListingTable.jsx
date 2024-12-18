import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Button } from '_common';
import {
  useFileListing,
  useSystemDisplayName,
  useSystems,
} from 'hooks/datafiles';

import DataFilesTable from '../../DataFilesTable/DataFilesTable';
import { FileIcon } from '../../DataFilesListing/DataFilesListingCells';
import styles from './DataFilesModalListingTable.module.scss';
import { useSelector, shallowEqual } from 'react-redux';

export function getCurrentDirectory(path) {
  return path.split('/').pop();
}

export function getParentPath(currentPath) {
  return currentPath.substr(0, currentPath.lastIndexOf('/'));
}

const BackLink = ({ api, scheme, system, currentPath }) => {
  const { fetchListing } = useFileListing('modal');

  const onClick = () => {
    fetchListing({
      api,
      scheme,
      system,
      path: getParentPath(currentPath),
    });
  };
  return (
    <Button
      type="link"
      className={styles['link']}
      iconNameBefore="nav-left"
      onClick={onClick}
    >
      Back
    </Button>
  );
};
BackLink.propTypes = {
  api: PropTypes.string.isRequired,
  scheme: PropTypes.string.isRequired,
  system: PropTypes.string.isRequired,
  currentPath: PropTypes.string.isRequired,
};

const DataFilesModalListingNameCell = ({
  api,
  scheme,
  system,
  path,
  name,
  format,
  isCurrentDirectory,
  indentSubFilesFolders,
}) => {
  const { fetchListing } = useFileListing('modal');
  const onClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    fetchListing({ api, scheme, system, path });
  };

  const isFolderButNotCurrentFolder =
    format === 'folder' && !isCurrentDirectory;

  return (
    <div
      className={`${styles.container} ${
        indentSubFilesFolders && !isCurrentDirectory ? styles.children : ''
      }`}
    >
      <FileIcon format={format} />
      {isFolderButNotCurrentFolder && (
        <a
          href=""
          onClick={onClick}
          className={`${styles.path} data-files-name data-files-nav-link`}
        >
          {name}
        </a>
      )}
      {!isFolderButNotCurrentFolder && (
        <span className={`data-files-name ${styles.path}`}>{name}</span>
      )}
    </div>
  );
};
DataFilesModalListingNameCell.propTypes = {
  api: PropTypes.string.isRequired,
  scheme: PropTypes.string.isRequired,
  system: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  format: PropTypes.string.isRequired,
  isCurrentDirectory: PropTypes.bool.isRequired,
  indentSubFilesFolders: PropTypes.bool.isRequired,
};

const DataFilesModalButtonCell = ({
  system,
  path,
  format,
  name,
  operationName,
  operationCallback,
  operationOnlyForFolders,
  disabled,
}) => {
  const onClick = () => operationCallback(system, path, name);
  const formatSupportsOperation =
    !operationOnlyForFolders || format === 'folder';
  return (
    formatSupportsOperation && (
      <span>
        <Button
          type="primary"
          className="float-right"
          disabled={disabled}
          onClick={onClick}
        >
          {operationName}
        </Button>
      </span>
    )
  );
};
DataFilesModalButtonCell.propTypes = {
  system: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  format: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  operationName: PropTypes.string.isRequired,
  operationCallback: PropTypes.func.isRequired,
  operationOnlyForFolders: PropTypes.bool.isRequired,
  disabled: PropTypes.bool.isRequired,
};

const DataFilesModalListingTable = ({
  data,
  operationName,
  operationCallback,
  operationOnlyForFolders,
  operationAllowedOnRootFolder,
  disabled,
}) => {
  const { loading, error, params, fetchMore } = useFileListing('modal');

  const { fetchSelectedSystem } = useSystems();

  const selectedSystem = fetchSelectedSystem(params);

  let systemName = selectedSystem?.name;
  const systemDisplayName = useSystemDisplayName(params);

  systemName = systemName ?? systemDisplayName;

  const homeDir = selectedSystem?.homeDir;

  const isNotRootOrHome =
    params.path !== '' &&
    params.path !== '/' &&
    params.path.replace(/^\/+/, '') !== homeDir?.replace(/^\/+/, '');

  const alteredData = useMemo(() => {
    const result = data.map((d) => {
      const entry = d;
      entry.isCurrentDirectory = false;
      return entry;
    });

    /* Add an entry to represent the current sub-directory */
    if (
      !loading &&
      !error &&
      (isNotRootOrHome || operationAllowedOnRootFolder)
    ) {
      const currentFolderEntry = {
        name: isNotRootOrHome ? getCurrentDirectory(params.path) : systemName,
        format: 'folder',
        system: params.system,
        path: params.path,
        isCurrentDirectory: true,
      };
      result.unshift(currentFolderEntry);
    }
    return result;
  }, [data, params, isNotRootOrHome, loading]);

  const NameCell = useCallback(
    ({
      row: {
        original: { name, format, path, isCurrentDirectory },
      },
    }) => (
      <DataFilesModalListingNameCell
        api={params.api}
        scheme={params.scheme}
        system={params.system}
        path={path}
        name={name}
        format={format}
        isCurrentDirectory={isCurrentDirectory}
        indentSubFilesFolders={isNotRootOrHome || operationAllowedOnRootFolder}
      />
    ),
    [params]
  );

  const ButtonCell = useCallback(
    ({
      row: {
        original: { system, path, format, name },
      },
    }) => (
      <DataFilesModalButtonCell
        api={params.api}
        scheme={params.scheme}
        system={system}
        path={path}
        name={name}
        format={format}
        operationName={operationName}
        operationCallback={operationCallback}
        operationOnlyForFolders={operationOnlyForFolders}
        disabled={disabled}
      />
    ),
    [params, operationName, operationCallback, disabled]
  );

  const hasBackButton = isNotRootOrHome;

  const BackHeader = useCallback(
    () => (
      <BackLink
        system={params.system}
        currentPath={params.path}
        api={params.api}
        scheme={params.scheme}
      />
    ),
    [params]
  );

  const columns = useMemo(
    () => [
      {
        Header: BackHeader,
        accessor: 'name',
        width: 0.7,
        Cell: NameCell,
      },
      {
        id: 'button',
        width: 0.3,
        Cell: ButtonCell,
      },
    ],
    [data]
  );

  const rowSelectCallback = () => {};
  return (
    <DataFilesTable
      data={alteredData}
      columns={columns}
      rowSelectCallback={rowSelectCallback}
      scrollBottomCallback={fetchMore}
      section="modal"
      hideHeader={!hasBackButton}
      shadeEvenRows={hasBackButton}
    />
  );
};
DataFilesModalListingTable.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  operationName: PropTypes.string.isRequired,
  operationCallback: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  operationOnlyForFolders: PropTypes.bool,
  operationAllowedOnRootFolder: PropTypes.bool,
};

DataFilesModalListingTable.defaultProps = {
  disabled: false,
  operationOnlyForFolders: false,
  operationAllowedOnRootFolder: false,
};

export default DataFilesModalListingTable;
