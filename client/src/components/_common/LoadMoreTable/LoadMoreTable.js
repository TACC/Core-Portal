import React from 'react';
import { useTable } from 'react-table';
import PropTypes from 'prop-types';
import './LoadMoreTable.scss';

const LoadMoreTable = ({ tableColumns, tableData }) => {
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

  return (
    <table {...getTableProps()}>
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
      <tbody {...getTableBodyProps()} className="jobs-table-body">
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

LoadMoreTable.propTypes = {
  tableColumns: PropTypes.array,
  tableData: PropTypes.array
};
LoadMoreTable.defaultProps = {
  tableColumns: [],
  tableData: []
};

export default LoadMoreTable;
