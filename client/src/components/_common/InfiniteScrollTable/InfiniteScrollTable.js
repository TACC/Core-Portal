import React from 'react';
import { useTable } from 'react-table';
import PropTypes from 'prop-types';
import LoadingSpinner from '../LoadingSpinner';
import './InfiniteScrollTable.module.scss';

/**
 * Get a modifier for a class name, based on given conditions
 * @param {string} baseName - A className on which to append the modifier name
 * @param {object} conditions - Conditions to allow modifier name to be determined
 * @param {object} conditions.isLoading - Whether data is loading
 * @param {object} conditions.hasData - Whether data is available
 */
function getClassNameModifier(baseName, { isLoading, hasData }) {
  let modifiers = [];

  if (isLoading) {
    modifiers.push('is-loading');
  }
  if (hasData) {
    modifiers.push('has-data');
  } else {
    modifiers.push('no-data');
  }

  // Add the base name
  modifiers = modifiers.map(modifier => modifier + baseName);

  return modifiers.join(' ');
}

const rowContentPropType = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.element,
  PropTypes.oneOf([React.Fragment])
]);

const InfiniteScrollLoadingRow = ({ isLoading, hasData }) => {
  if (!isLoading) {
    return null;
  }

  const placement = hasData ? 'inline' : 'section';

  return (
    <tr styleName="status">
      <td styleName="status__message">
        <LoadingSpinner placement={placement} />
      </td>
    </tr>
  );
};
InfiniteScrollLoadingRow.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  hasData: PropTypes.bool.isRequired
};

const InfiniteScrollNoDataRow = ({ display, noDataText }) => {
  if (!display) {
    return null;
  }
  return (
    <tr styleName="status">
      <td styleName="status__message  cell cell--has-text-nodes">
        {noDataText}
      </td>
    </tr>
  );
};
InfiniteScrollNoDataRow.propTypes = {
  display: PropTypes.bool.isRequired,
  noDataText: rowContentPropType.isRequired
};

const InfiniteScrollTable = ({
  tableColumns,
  tableData,
  onInfiniteScroll,
  isLoading,
  className,
  noDataText,
  getRowProps
}) => {
  const columns = React.useMemo(() => tableColumns, []);
  const data = React.useMemo(() => tableData, [tableData]);
  const hasData = tableData.length !== 0;
  const modifierStyleName = getClassNameModifier('', {
    isLoading,
    hasData
  });

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
    <table
      {...getTableProps()}
      className={`${className} o-fixed-header-table`}
      styleName={`container ${modifierStyleName}`}
    >
      <thead>
        {headerGroups.map(headerGroup => (
          <tr
            {...headerGroup.getHeaderGroupProps()}
            className="o-fixed-header-table__row"
          >
            {headerGroup.headers.map(column => (
              <th {...column.getHeaderProps()}>{column.render('Header')}</th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody
        {...getTableBodyProps()}
        onScroll={onScroll}
        className="o-fixed-header-table__body"
      >
        {rows.map(row => {
          prepareRow(row);
          return (
            <tr
              {...row.getRowProps()}
              {...getRowProps(row)}
              className="o-fixed-header-table__row"
            >
              {row.cells.map(cell => {
                return (
                  <td {...cell.getCellProps()} styleName="cell">
                    {cell.render('Cell')}
                  </td>
                );
              })}
            </tr>
          );
        })}
        <InfiniteScrollLoadingRow isLoading={isLoading} hasData={hasData} />
        <InfiniteScrollNoDataRow
          display={!isLoading && !hasData}
          noDataText={noDataText}
        />
      </tbody>
    </table>
  );
};

InfiniteScrollTable.propTypes = {
  tableColumns: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  tableData: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  onInfiniteScroll: PropTypes.func,
  isLoading: PropTypes.bool,
  className: PropTypes.string,
  noDataText: rowContentPropType,
  getRowProps: PropTypes.func
};
InfiniteScrollTable.defaultProps = {
  onInfiniteScroll: offset => {},
  isLoading: false,
  className: '',
  noDataText: '',
  getRowProps: row => {}
};

export default InfiniteScrollTable;
