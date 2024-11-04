import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useSelector, shallowEqual } from 'react-redux';
import { LoadingSpinner } from '_common';
import DataFilesTable from '../../DataFilesTable/DataFilesTable';
import {
  FileLengthCell,
  FileIconCell,
} from '../../DataFilesListing/DataFilesListingCells';

const DataFilesSelectedStatusCell = ({ row, operation }) => {
  const status = useSelector(
    (state) => state.files.operationStatus[operation],
    shallowEqual
  );
  switch (status[row.original.id]) {
    case 'RUNNING':
      return <LoadingSpinner placement="inline" />;
    case 'SUCCESS':
      return <span className="badge bg-success">SUCCESS</span>;
    case 'ERROR':
      return <span className="badge bg-danger">ERROR</span>;
    default:
      return <></>;
  }
};
DataFilesSelectedStatusCell.propTypes = {
  row: PropTypes.shape({ original: PropTypes.shape({ id: PropTypes.string }) })
    .isRequired,
  operation: PropTypes.string.isRequired,
};

const DataFilesSelectedNameCell = ({ cell: { value } }) => {
  return <span className="data-files-name">{value}</span>;
};
DataFilesSelectedNameCell.propTypes = {
  cell: PropTypes.shape({ value: PropTypes.string }).isRequired,
};

const DataFilesSelectedTable = ({ data, operation }) => {
  const rowSelectCallback = () => {};
  const scrollBottomCallback = () => {};

  const columns = useMemo(
    () => [
      {
        id: 'icon',
        accessor: (row) => row,
        width: 0.1,
        minWidth: 20,
        maxWidth: 30,
        Cell: FileIconCell,
      },
      {
        accessor: 'name',
        width: 0.5,
        Cell: DataFilesSelectedNameCell,
      },
      {
        id: 'Size',
        accessor: 'length',
        Cell: FileLengthCell,
        width: 0.25,
      },
      {
        id: 'status',
        width: 0.15,
        minWidth: 80,
        Cell: ({ row }) => DataFilesSelectedStatusCell({ row, operation }),
      },
    ],
    [data, operation]
  );
  return (
    <DataFilesTable
      data={data}
      columns={columns}
      rowSelectCallback={rowSelectCallback}
      scrollBottomCallback={scrollBottomCallback}
      section="modalSelected"
      hideHeader
    />
  );
};
DataFilesSelectedTable.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  operation: PropTypes.string.isRequired,
};

export default DataFilesSelectedTable;
