import React, { useCallback, useLayoutEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useSelector, shallowEqual } from 'react-redux';
import { useLocation } from 'react-router-dom';
import {
  useSelectedFiles,
  useFileListing,
  useSystems,
  useSystemDisplayName,
} from 'hooks/datafiles';
import {
  CheckboxCell,
  CheckboxHeaderCell,
  FileNavCell,
  FileLengthCell,
  LastModifiedCell,
  FileIconCell,
  ViewPathCell,
} from './DataFilesListingCells';
import DataFilesTable from '../DataFilesTable/DataFilesTable';
import Searchbar from '_common/Searchbar';
import { getCurrentDirectory } from '../DataFilesModals/DataFilesModalTables/DataFilesModalListingTable';

const fileTypes = [
  'Audio',
  'Code',
  'Documents',
  'Folders',
  'Images',
  'Jupyter Notebook',
  'PDF',
  'Presentation',
  'Spreadsheet',
  'Shape File',
  'Text',
  'ZIP',
  '3D Visualization',
];

const DataFilesListing = ({ api, scheme, system, path, isPublic }) => {
  // Redux hooks
  const location = useLocation();
  const systems = useSelector(
    (state) => state.systems.storage.configuration,
    shallowEqual
  );
  const sharedWorkspaces = systems.find((e) => e.scheme === 'projects');
  const isPortalProject = scheme === 'projects';
  const hideSearchBar = isPortalProject && sharedWorkspaces.hideSearchBar;

  const showViewPath = useSelector(
    (state) =>
      api === 'tapis' && state.workbench && state.workbench.config.viewPath
  );

  const {
    data: files,
    loading,
    error,
    fetchListing,
    fetchMore,
  } = useFileListing('FilesListing');
  const { selectFile } = useSelectedFiles();

  useLayoutEffect(() => {
    fetchListing({ api, scheme, system, path });
  }, [api, scheme, system, path, location]);

  const checkboxCellCallback = useCallback(
    ({ row }) => (
      <CheckboxCell
        index={row.index}
        name={row.original.name}
        format={row.original.format}
        disabled={row.original.disabled}
      />
    ),
    []
  );

  const fileNavCellCallback = useCallback(
    ({ row }) => {
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
        />
      );
    },
    [api, scheme]
  );

  const columns = useMemo(() => {
    const cells = [
      {
        id: 'checkbox',
        width: 0.05,
        minWidth: 20,
        maxWidth: 40,
        Header: CheckboxHeaderCell,
        Cell: checkboxCellCallback,
      },
      {
        id: 'icon',
        accessor: (row) => row,
        width: 0.05,
        minWidth: 20,
        maxWidth: 25,
        Cell: FileIconCell,
      },
      {
        Header: 'Name',
        accessor: 'name',
        width: 0.5,
        Cell: fileNavCellCallback,
      },
      {
        Header: 'Size',
        accessor: 'length',
        Cell: FileLengthCell,
        width: 0.2,
      },
      {
        Header: 'Last Modified',
        accessor: 'lastModified',
        Cell: LastModifiedCell,
        width: 0.2,
      },
    ];
    if (showViewPath) {
      // Modify these column widths
      ['Size', 'Last Modified'].forEach((header) => {
        cells.find((col) => col.Header === header).width = 0.15;
      });
      cells.push({
        Header: 'Path',
        width: 0.1,
        Cell: (el) => <ViewPathCell file={el.row.original} api={api} />,
      });
    }
    return cells;
  }, [api, showViewPath, fileNavCellCallback]);

  const { fetchSelectedSystem } = useSystems();
  const selectedSystem = fetchSelectedSystem({ scheme, system, path });
  const systemDisplayName = useSystemDisplayName({ scheme, system, path });
  const homeDir = selectedSystem?.homeDir;

  // Check if the current path is the root directory
  const isRootDir = path === '/' || path === '';

  // Adjusted check for home directory
  const isAtHomeDir =
    isRootDir || path.replace(/^\/+/, '') === homeDir?.replace(/^\/+/, '');

  // Determine the sectionName with added handling for root directory
  function determineSectionName(
    isAtHomeDir,
    isRootDir,
    systemDisplayName,
    path
  ) {
    if (isAtHomeDir) {
      return systemDisplayName;
    }
    return getCurrentDirectory(path);
  }

  const sectionName = determineSectionName(
    isAtHomeDir,
    isRootDir,
    systemDisplayName,
    path
  );

  return (
    <>
      {!hideSearchBar && (
        <Searchbar
          api={api}
          scheme={scheme}
          system={system}
          sectionName={sectionName}
          path={path}
          resultCount={files.length}
          dataType="Files"
          filterTypes={fileTypes}
          infiniteScroll
          disabled={loading || !!error}
        />
      )}
      <div className="o-flex-item-table-wrap">
        <DataFilesTable
          data={files}
          columns={columns}
          rowSelectCallback={selectFile}
          scrollBottomCallback={fetchMore}
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
  isPublic: PropTypes.bool,
};
DataFilesListing.defaultProps = {
  isPublic: false,
};

export default DataFilesListing;
