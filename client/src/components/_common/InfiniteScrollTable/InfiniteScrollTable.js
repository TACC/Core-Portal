import React from 'react';
import { useTable } from 'react-table';
import PropTypes from 'prop-types';
import LoadingSpinner from '../LoadingSpinner';
import './InfiniteScrollTable.scss';

const InfiniteScrollLoadingRow = ({ isLoading }) => {
  if (!isLoading) {
    return null;
  }
  return (
    <tr className="-loading">
      <td>
        <LoadingSpinner placement="inline" />
      </td>
    </tr>
  );
};
InfiniteScrollLoadingRow.propTypes = {
  isLoading: PropTypes.bool.isRequired
};

const InfiniteScrollTable = ({
  tableColumns,
  tableData,
  onInfiniteScroll,
  isLoading,
  className
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
    if (bottom && target.scrollTop > 0) {
      onInfiniteScroll(tableData.length);
    }
  };

  return (
    <table {...getTableProps()} className={`${className} InfiniteScrollTable`}>
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
        <InfiniteScrollLoadingRow isLoading={isLoading} />
      </tbody>
    </table>
  );
};

InfiniteScrollTable.propTypes = {
  tableColumns: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  tableData: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  onInfiniteScroll: PropTypes.func,
  isLoading: PropTypes.bool,
  className: PropTypes.string
};
InfiniteScrollTable.defaultProps = {
  onInfiniteScroll: offset => {},
  isLoading: false,
  className: ''
};

export default InfiniteScrollTable;
