import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { parse } from 'query-string';
import { useLocation } from 'react-router-dom';
import {
  CheckboxCell,
  CheckboxHeaderCell,
  FileNavCell,
  FileLengthCell,
  LastModifiedCell,
  FileIconCell,
  ViewPathCell
} from './DataFilesListingCells';
import DataFilesSearchbar from '../DataFilesSearchbar/DataFilesSearchbar';
import DataFilesTable from '../DataFilesTable/DataFilesTable';

const DataFilesListing = ({ api, scheme, system, path, isPublic }) => {
  // Redux hooks
  const dispatch = useDispatch();
  const { query_string: queryString, filter } = parse(useLocation().search);
  const { files, loading, error } = useSelector(
    state => ({
      files: state.files.listing.FilesListing,
      loading: state.files.loading.FilesListing,
      error: state.files.error.FilesListing
    }),
    shallowEqual
  );
  const systems = useSelector(
    state => state.systems.storage.configuration,
    shallowEqual
  );
  const sharedWorkspaces = systems.find(e => e.scheme === 'projects');
  const isPortalProject = scheme === 'projects';
  const hideSearchBar = isPortalProject && sharedWorkspaces.hideSearchBar;
  const trashOperationStatusTable = useSelector(
    state => state.files.operationStatus.trash
  );

  const showViewPath = useSelector(
    state =>
      api === 'tapis' && state.workbench && state.workbench.config.viewPath
  );

  const scrollBottomCallback = useCallback(() => {
    dispatch({
      type: 'SCROLL_FILES',
      payload: {
        api,
        scheme,
        system,
        path: path || '/',
        section: 'FilesListing',
        offset: files.length,
        queryString,
        filter,
        nextPageToken: files.nextPageToken
      }
    });
  }, [dispatch, files.length]);

  const rowSelectCallback = useCallback(index => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_SELECT',
      payload: { index, section: 'FilesListing' }
    });
  }, []);

  const checkboxCellCallback = useCallback(
    ({ row }) => {
      const trashInProgress =
        trashOperationStatusTable[row.original.system + row.original.path] ===
        'RUNNING';
      return (
        <CheckboxCell index={row.index} trashInProgress={trashInProgress} />
      );
    },
    [trashOperationStatusTable]
  );

  const fileNavCellCallback = useCallback(
    ({ row }) => {
      const trashInProgress =
        trashOperationStatusTable[row.original.system + row.original.path] ===
        'RUNNING';
      return (
        <FileNavCell
          system={row.original.system}
          path={row.original.path}
          name={row.original.name}
          format={row.original.format}
          api={api}
          scheme={scheme}
          href={row.original._links.self.href}
          isPublic={isPublic}
          length={row.original.length}
          trashInProgress={trashInProgress}
        />
      );
    },
    [api, scheme, trashOperationStatusTable]
  );

  const columns = useMemo(() => {
    const cells = [
      {
        id: 'checkbox',
        width: 0.05,
        minWidth: 20,
        maxWidth: 40,
        Header: CheckboxHeaderCell,
        Cell: checkboxCellCallback
      },
      {
        id: 'icon',
        accessor: row => [
          row.format,
          row.path,
          trashOperationStatusTable[row.system + row.path] === 'RUNNING'
        ],
        width: 0.05,
        minWidth: 20,
        maxWidth: 25,
        Cell: FileIconCell
      },
      {
        Header: 'Name',
        accessor: 'name',
        width: 0.5,
        Cell: fileNavCellCallback
      },
      {
        Header: 'Size',
        accessor: row => [
          row.length,
          trashOperationStatusTable[row.system + row.path] === 'RUNNING'
        ],
        Cell: FileLengthCell,
        width: 0.2
      },
      {
        Header: 'Last Modified',
        accessor: row => [
          row.lastModified,
          trashOperationStatusTable[row.system + row.path] === 'RUNNING'
        ],
        Cell: LastModifiedCell,
        width: 0.2
      }
    ];
    if (showViewPath) {
      // Modify these column widths
      ['Size', 'Last Modified'].forEach(header => {
        cells.find(col => col.Header === header).width = 0.15;
      });
      cells.push({
        Header: 'Path',
        width: 0.1,
        Cell: el => (
          <ViewPathCell
            file={el.row.original}
            api={api}
            trashInProgress={
              trashOperationStatusTable[
                el.row.original.system + el.row.original.path
              ] === 'RUNNING'
            }
          />
        )
      });
    }
    return cells;
  }, [api, showViewPath, fileNavCellCallback, trashOperationStatusTable]);

  return (
    <>
      {!hideSearchBar && (
        <DataFilesSearchbar
          api={api}
          scheme={scheme}
          system={system}
          resultCount={files.length}
          publicData={isPublic}
          disabled={loading || !!error}
        />
      )}
      <div className="o-flex-item-table-wrap">
        <DataFilesTable
          data={files}
          columns={columns}
          rowSelectCallback={rowSelectCallback}
          scrollBottomCallback={scrollBottomCallback}
          section="FilesListing"
        />
      </div>
    </>
  );
};
DataFilesListing.propTypes = {
  api: PropTypes.string.isRequired,
  scheme: PropTypes.string.isRequired,
  system: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  isPublic: PropTypes.bool
};
DataFilesListing.defaultProps = {
  isPublic: false
};

export default DataFilesListing;
