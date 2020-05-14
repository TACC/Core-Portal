import React from 'react';
import { useTable } from 'react-table';
import PropTypes from 'prop-types';
import './PaginationTable.scss';

const PaginationTable = ({ tableColumns, tableData }) => {
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

  /* TODO: After, FP-103, use `composes:` to apply `o-fixed-header-table` */
  return (
    <table {...getTableProps()} className="PaginationTable o-fixed-header-table">
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
      <tbody {...getTableBodyProps()}>
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
  tableColumns: PropTypes.array,
  tableData: PropTypes.array
};
PaginationTable.defaultProps = {
  tableColumns: [],
  tableData: []
};

export default PaginationTable;
