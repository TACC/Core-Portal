import React, { useCallback } from 'react';
import { useTable } from 'react-table';
import PropTypes from 'prop-types';
import './PaginationTable.scss';

const PaginationTable = ({ tableColumns, tableData, onPagination, isLoading }) => {
  const columns = React.useMemo(
    () => tableColumns,
    []
  )
  const data = React.useMemo(
    () => tableData,
    []
  )

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable(
    { columns, data }
  )

  const onScroll = ({ target }) => {
    const bottom = target.scrollHeight - target.scrollTop === target.clientHeight;
    if (bottom) {
      onPagination(tableData.length);
    }
  }

  return (
    <table {...getTableProps()} className="PaginationTable">
      <thead>
        {headerGroups.map(headerGroup => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map(column => (
              <th
                {...column.getHeaderProps()}
              >
                {column.render('Header')}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()} onScroll={onScroll}>
        {rows.map(row => {
          prepareRow(row)
          return (
            <tr {...row.getRowProps()}>
              {row.cells.map(cell => {
                return (
                  <td
                    {...cell.getCellProps()}
                  >
                    {cell.render('Cell')}
                  </td>
                )
              })}
            </tr>
          )
        })}
      </tbody>
    </table>
  );
};

PaginationTable.propTypes = {
  tableColumns: PropTypes.array.isRequired,
  tableData: PropTypes.array.isRequired,
  onPagination: PropTypes.func
};
PaginationTable.defaultProps = {
  tableColumns: [],
  tableData: [],
  onPagination: (offset) => { }
};

export default PaginationTable;
