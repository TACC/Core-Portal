import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useSelector, shallowEqual } from 'react-redux';

import DataFilesTable from '../../DataFilesTable/DataFilesTable';

const DataFilesSelectedStatusCell = ({ row }) => {
  const moveStatus = useSelector(
    state => state.files.operationStatus.move,
    shallowEqual
  );
  return <div>{moveStatus[row.index] || 'not moving'}</div>;
};
DataFilesSelectedStatusCell.propTypes = {
  row: PropTypes.shape({ index: PropTypes.number }).isRequired
};

const DataFilesSelectedTable = ({ data }) => {
  const rowSelectCallback = () => {};
  const scrollBottomCallback = () => {};

  const columns = useMemo(
    () => [
      { Header: 'Name', accessor: 'name', width: 0.8 },
      {
        Header: 'moving?',
        width: 0.2,
        Cell: DataFilesSelectedStatusCell
      }
    ],
    [data]
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
  data: PropTypes.arrayOf(PropTypes.shape({})).isRequired
};

export default DataFilesSelectedTable;
