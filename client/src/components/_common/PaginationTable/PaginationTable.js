import React from 'react';
import { useTable } from 'react-table';
import PropTypes from 'prop-types';
import LoadingSpinner from '../LoadingSpinner';
import './PaginationTable.scss';

const PaginationLoadingRow = ({ isLoading }) => {
  if (!isLoading) {
    return null;
  }
  return (
    <div className="-loading">
      <LoadingSpinner placement="inline" />
    </div>
  );
};
PaginationLoadingRow.propTypes = {
  isLoading: PropTypes.bool.isRequired
};

const PaginationTable = ({
  tableColumns,
  tableData,
  onPagination,
  isLoading
}) => {
  const columns = React.useMemo(() => tableColumns, []);
  const data = React.useMemo(() => tableData, [tableData]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow
  } = useTable({ columns, data });

  const onScroll = ({ target }) => {
    const bottom =
      target.scrollHeight - target.scrollTop === target.clientHeight;
    if (bottom) {
      onPagination(tableData.length);
    }
  };

  return (
    <table {...getTableProps()} className="PaginationTable">
      <thead>
        {headerGroups.map(headerGroup => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map(column => (
              <th {...column.getHeaderProps()}>{column.render('Header')}</th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()} onScroll={onScroll}>
        {rows.map(row => {
          prepareRow(row);
          return (
            <tr {...row.getRowProps()}>
              {row.cells.map(cell => {
                return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>;
              })}
            </tr>
          );
        })}
        {<PaginationLoadingRow isLoading={isLoading} />}
      </tbody>
    </table>
  );
};

PaginationTable.propTypes = {
  tableColumns: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  tableData: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  onPagination: PropTypes.func,
  isLoading: PropTypes.bool
};
PaginationTable.defaultProps = {
  onPagination: offset => {},
  isLoading: false
};

export default PaginationTable;
