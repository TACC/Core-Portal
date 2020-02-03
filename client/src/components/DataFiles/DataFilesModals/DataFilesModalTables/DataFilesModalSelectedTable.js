import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useSelector, shallowEqual } from 'react-redux';

import DataFilesTable from '../../DataFilesTable/DataFilesTable';

const DataFilesSelectedStatusCell = ({ row, operation }) => {
  const status = useSelector(
    state => state.files.operationStatus[operation],
    shallowEqual
  );
  return <div>{status[row.original.id]}</div>;
};
DataFilesSelectedStatusCell.propTypes = {
  row: PropTypes.shape({ original: PropTypes.shape({ id: PropTypes.string }) })
    .isRequired,
  operation: PropTypes.string.isRequired
};

const DataFilesSelectedTable = ({ data, operation }) => {
  const rowSelectCallback = () => {};
  const scrollBottomCallback = () => {};

  const columns = useMemo(
    () => [
      { Header: 'Name', accessor: 'name', width: 0.8 },
      {
        id: 'status',
        width: 0.2,
        Cell: ({ row }) => DataFilesSelectedStatusCell({ row, operation })
      }
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
    />
  );
};
DataFilesSelectedTable.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  operation: PropTypes.string.isRequired
};

export default DataFilesSelectedTable;
