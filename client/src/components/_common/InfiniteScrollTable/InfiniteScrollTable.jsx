import React from 'react';
import { useTable } from 'react-table';
import PropTypes from 'prop-types';
import LoadingSpinner from '../LoadingSpinner';
import './InfiniteScrollTable.scss';

const rowContentPropType = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.element,
  PropTypes.oneOf([React.Fragment]),
]);

const InfiniteScrollLoadingRow = ({ isLoading }) => {
  if (!isLoading) {
    return null;
  }
  return (
    <tr className="-status">
      {/* Ensure cell spans across ALL columns */}
      <td colSpan="99">
        <LoadingSpinner placement="inline" />
      </td>
    </tr>
  );
};
InfiniteScrollLoadingRow.propTypes = {
  isLoading: PropTypes.bool.isRequired,
};

const InfiniteScrollNoDataRow = ({ display, noDataText }) => {
  if (!display) {
    return null;
  }
  return (
    <tr className="-status">
      {/* Ensure cell spans across ALL columns */}
      <td colSpan="99">
        <span className="-status__message">{noDataText}</span>
      </td>
    </tr>
  );
};
InfiniteScrollNoDataRow.propTypes = {
  display: PropTypes.bool.isRequired,
  noDataText: rowContentPropType.isRequired,
};

const InfiniteScrollTable = ({
  tableColumns,
  tableData,
  onInfiniteScroll = (offset) => {},
  isLoading = false,
  className = '',
  noDataText = '',
  getRowProps = (row) => {},
  columnMemoProps = [],
}) => {
  const columns = React.useMemo(() => tableColumns, columnMemoProps);
  const data = React.useMemo(() => tableData, [tableData]);

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable({ columns, data });

  const onScroll = ({ target }) => {
    const scrollbarHeight = target.offsetHeight - target.clientHeight;
    const clientRectHeight = target.getBoundingClientRect().height;
    const clientCalcHeight = clientRectHeight - scrollbarHeight;
    const difference = Math.floor(target.scrollHeight - target.scrollTop);

    const bottom = difference <= clientCalcHeight;

    if (bottom && target.scrollTop > 0) {
      onInfiniteScroll(tableData.length);
    }
  };

  return (
    <div className={'table-container'} onScroll={onScroll}>
      <table
        {...getTableProps()}
        className={`${className} InfiniteScrollTable o-fixed-header-table`}
      >
        <thead>
          {headerGroups.map((headerGroup) => {
            const { key: headerGroupKey, ...headerGroupProps } =
              headerGroup.getHeaderGroupProps();
            return (
              <tr key={headerGroupKey} {...headerGroupProps}>
                {headerGroup.headers.map((column) => {
                  const { key: columnKey, ...columnProps } =
                    column.getHeaderProps();
                  return (
                    <th key={columnKey} {...columnProps}>
                      {column.render('Header')}
                    </th>
                  );
                })}
              </tr>
            );
          })}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row) => {
            prepareRow(row);
            const { key: rowKey, ...rowProps } = row.getRowProps();
            return (
              <tr key={rowKey} {...rowProps} {...getRowProps(row)}>
                {row.cells.map((cell) => {
                  const { key: cellKey, ...cellProps } = cell.getCellProps({
                    className: cell.column.className,
                  });
                  return (
                    <td key={cellKey} {...cellProps}>
                      {cell.render('Cell')}
                    </td>
                  );
                })}
              </tr>
            );
          })}
          <InfiniteScrollLoadingRow isLoading={isLoading} />
          <InfiniteScrollNoDataRow
            display={!isLoading && tableData.length === 0}
            noDataText={noDataText}
          />
        </tbody>
      </table>
    </div>
  );
};

InfiniteScrollTable.propTypes = {
  tableColumns: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  tableData: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  onInfiniteScroll: PropTypes.func,
  isLoading: PropTypes.bool,
  className: PropTypes.string,
  noDataText: rowContentPropType,
  getRowProps: PropTypes.func,
  columnMemoProps: PropTypes.arrayOf(PropTypes.any),
  cell: PropTypes.object,
};

export default InfiniteScrollTable;
