import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import {
  CheckboxCell,
  CheckboxHeaderCell,
  FileNavCell,
  FileLengthCell,
  LastModifiedCell,
  FileIconCell
} from './DataFilesListingCells';
import DataFilesTable from '../DataFilesTable/DataFilesTable';

const DataFilesListing = ({ api, scheme, system, path }) => {
  // Redux hooks
  const dispatch = useDispatch();
  const files = useSelector(
    state => state.files.listing.FilesListing,
    shallowEqual
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
        offset: files.length
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
        />
      );
    },
    [api, scheme]
  );

  const columns = useMemo(() => [
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
  ]);

  return (
    <DataFilesTable
      data={files}
      columns={columns}
      rowSelectCallback={rowSelectCallback}
      scrollBottomCallback={scrollBottomCallback}
      section="FilesListing"
    />
  );
};
DataFilesListing.propTypes = {
  api: PropTypes.string.isRequired,
  scheme: PropTypes.string.isRequired,
  system: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired
};

export default DataFilesListing;
