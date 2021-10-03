import React, { useCallback, useMemo } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import PropTypes from 'prop-types';
import { Button } from 'reactstrap';
import { useLocation } from 'react-router-dom';
import { parse } from 'query-string';

import { Icon } from '_common';
import { findSystemDisplayName } from 'utils/systems';

import DataFilesTable from '../../DataFilesTable/DataFilesTable';
import { FileIcon } from '../../DataFilesListing/DataFilesListingCells';
import './DataFilesModalListingTable.module.scss';

export function getCurrentDirectory(path) {
  return path.split('/').pop();
}

export function getParentPath(currentPath) {
  return currentPath.substr(0, currentPath.lastIndexOf('/'));
}

const BackLink = ({ api, scheme, system, currentPath }) => {
  const dispatch = useDispatch();

  const onClick = () => {
    dispatch({
      type: 'FETCH_FILES',
      payload: {
        api,
        scheme,
        system,
        path: getParentPath(currentPath),
        section: 'modal'
      }
    });
  };
  return (
    <Button styleName="link" color="link" onClick={onClick}>
      <Icon styleName="link-icon" name="nav-left" />
      <span styleName="path">Back</span>
    </Button>
  );
};
BackLink.propTypes = {
  api: PropTypes.string.isRequired,
  scheme: PropTypes.string.isRequired,
  system: PropTypes.string.isRequired,
  currentPath: PropTypes.string.isRequired
};

const DataFilesModalListingNameCell = ({
  api,
  scheme,
  system,
  path,
  name,
  format,
  isCurrentDirectory,
  indentSubFilesFolders
}) => {
  const dispatch = useDispatch();
  const onClick = e => {
    e.preventDefault();
    e.stopPropagation();
    dispatch({
      type: 'FETCH_FILES',
      payload: { api, scheme, system, path, section: 'modal' }
    });
  };

  const isFolderButNotCurrentFolder =
    format === 'folder' && !isCurrentDirectory;

  return (
    <div
      styleName={`container ${
        indentSubFilesFolders && !isCurrentDirectory ? 'children' : ''
      }`}
    >
      <FileIcon format={format} />
      {isFolderButNotCurrentFolder && (
        <a
          href=""
          onClick={onClick}
          styleName="path"
          className="data-files-name data-files-nav-link"
        >
          {name}
        </a>
      )}
      {!isFolderButNotCurrentFolder && (
        <span styleName="path" className="data-files-name">
          {name}
        </span>
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
  indentSubFilesFolders: PropTypes.bool.isRequired
};

const DataFilesModalButtonCell = ({
  system,
  path,
  format,
  name,
  operationName,
  operationCallback,
  operationOnlyForFolders,
  disabled
}) => {
  const onClick = () => operationCallback(system, path, name);
  const formatSupportsOperation =
    !operationOnlyForFolders || format === 'folder';
  return (
    formatSupportsOperation && (
      <span>
        <Button
          disabled={disabled}
          className="float-right data-files-btn"
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
  disabled: PropTypes.bool.isRequired
};

const DataFilesModalListingTable = ({
  data,
  operationName,
  operationCallback,
  operationOnlyForFolders,
  operationAllowedOnRootFolder,
  disabled
}) => {
  const dispatch = useDispatch();
  const loading = useSelector(state => state.files.loading.modal);
  const error = useSelector(state => state.files.error.modal);
  const params = useSelector(state => state.files.params.modal, shallowEqual);
  const systemList = useSelector(state => state.systems.storage.configuration);
  const isNotRoot = params.path.length > 0;

  const alteredData = useMemo(() => {
    const result = data.map(d => {
      const entry = d;
      entry.isCurrentDirectory = false;
      return entry;
    });

    /* Add an entry to represent the current sub-directory */
    if (!loading && !error && (isNotRoot || operationAllowedOnRootFolder)) {
      const currentFolderEntry = {
        name: isNotRoot
          ? getCurrentDirectory(params.path)
          : findSystemDisplayName(systemList, params.system, !isNotRoot),
        format: 'folder',
        system: params.system,
        path: params.path,
        isCurrentDirectory: true
      };
      result.unshift(currentFolderEntry);
    }
    return result;
  }, [data, params, isNotRoot, loading]);

  const NameCell = useCallback(
    ({
      row: {
        original: { name, format, path, isCurrentDirectory }
      }
    }) => (
      <DataFilesModalListingNameCell
        api={params.api}
        scheme={params.scheme}
        system={params.system}
        path={path}
        name={name}
        format={format}
        isCurrentDirectory={isCurrentDirectory}
        indentSubFilesFolders={isNotRoot || operationAllowedOnRootFolder}
      />
    ),
    [params]
  );

  const ButtonCell = useCallback(
    ({
      row: {
        original: { system, path, format, name }
      }
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

  const hasBackButton = params.path.length > 0;

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
        Cell: NameCell
      },
      {
        id: 'button',
        width: 0.3,
        Cell: ButtonCell
      }
    ],
    [data]
  );

  const queryString = parse(useLocation().search).query_string;
  const rowSelectCallback = () => {};
  const scrollBottomCallback = useCallback(() => {
    dispatch({
      type: 'SCROLL_FILES',
      payload: {
        ...params,
        queryString,
        section: 'modal',
        offset: data.length
      }
    });
  }, [dispatch, data.length]);
  return (
    <DataFilesTable
      data={alteredData}
      columns={columns}
      rowSelectCallback={rowSelectCallback}
      scrollBottomCallback={scrollBottomCallback}
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
  operationAllowedOnRootFolder: PropTypes.bool
};

DataFilesModalListingTable.defaultProps = {
  disabled: false,
  operationOnlyForFolders: false,
  operationAllowedOnRootFolder: false
};

export default DataFilesModalListingTable;
