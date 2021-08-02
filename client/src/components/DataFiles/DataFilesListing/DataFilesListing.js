import React, { useCallback, useMemo, useEffect, useState } from 'react';
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
import fileTypes from '../DataFilesSearchbar/FileTypes';

const DataFilesListing = ({ api, scheme, system, path, isPublic }) => {
  // Redux hooks
  const dispatch = useDispatch();
  const queryString = parse(useLocation().search).query_string;
  const { files, loading, error } = useSelector(
    state => ({
      files: state.files.listing.FilesListing,
      loading: state.files.loading.FilesListing,
      error: state.files.error.FilesListing
    }),
    shallowEqual
  );

  const [filterType, setFilterType] = useState();
  const [filteredFiles, setFilteredFiles] = useState(files);
  useEffect(() => {
    const fileFilter = fileTypes.find(f => f.type === filterType);
    if (!fileFilter) {
      setFilteredFiles(files);
    } else if (fileFilter.type === 'Folders') {
      setFilteredFiles(files.filter(f => f.format === 'folder'));
    } else {
      setFilteredFiles(
        files.filter(f =>
          fileFilter.extensions.some(ext => f.name.endsWith(ext))
        )
      );
    }
  }, [filterType, files]);

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
    ({ row }) => <CheckboxCell index={row.index} />,
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
        Cell: checkboxCellCallback
      },
      {
        id: 'icon',
        accessor: 'format',
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
      { Header: 'Size', accessor: 'length', Cell: FileLengthCell, width: 0.2 },
      {
        Header: 'Last Modified',
        accessor: 'lastModified',
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
        Cell: el => <ViewPathCell file={el.row.original} api={api} />
      });
    }
    return cells;
  }, [api, showViewPath, fileNavCellCallback]);

  return (
    <>
      <DataFilesSearchbar
        api={api}
        scheme={scheme}
        system={system}
        filterType={filterType}
        setFilterType={setFilterType}
        resultCount={files.length}
        publicData={isPublic}
        disabled={loading || error}
      />
      <div className="o-flex-item-table-wrap">
        <DataFilesTable
          data={filteredFiles}
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
