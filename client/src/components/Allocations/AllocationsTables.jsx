import React, { useMemo } from 'react';
import { useTable, useSortBy } from 'react-table';
import { useSelector, useDispatch } from 'react-redux';
import { string } from 'prop-types';
import { Message } from '_common';
import { Team, Systems, Awarded, Remaining, Expires } from './AllocationsCells';
import systemAccessor from './AllocationsUtils';

import styles from './AllocationsTables.module.css';

export const useAllocations = (page) => {
  const allocations = useSelector((state) => {
    if (page === 'expired') return state.allocations.inactive;
    return state.allocations.active;
  });
  const columns = useMemo(
    () => [
      {
        Header: 'Title',
        accessor: 'projectName',
        sortType: 'alphanumeric',
      },
      {
        Header: 'PI',
        accessor: 'pi',
      },
      {
        Header: 'Team',
        accessor: ({ projectId }) => ({
          projectId,
          page,
        }),
        Cell: Team,
      },
      {
        Header: 'Systems',
        accessor: ({ systems }) => systemAccessor(systems, 'Systems'),
        id: 'name',
        Cell: Systems,
        className: 'system-cell',
      },
      {
        Header: 'Awarded',
        accessor: ({ systems }) => systemAccessor(systems, 'Awarded'),
        id: 'awarded',
        Cell: Awarded,
        className: 'system-cell',
      },
      {
        Header: 'Remaining',
        accessor: ({ systems }) => systemAccessor(systems, 'Remaining'),
        id: 'remaining',
        Cell: Remaining,
        className: 'system-cell',
      },
      {
        Header: page === 'approved' ? 'Expires' : 'Expired',
        accessor: ({ systems }) => systemAccessor(systems, 'Expires'),
        id: 'expires',
        Cell: Expires,
        className: 'system-cell',
      },
    ],
    [allocations]
  );
  const data = useMemo(() => allocations, [allocations]);
  return [
    {
      columns,
      data,
      initialState: { sortBy: [{ id: 'projectName' }] },
    },
    useSortBy,
  ];
};

const ErrorMessage = () => {
  const dispatch = useDispatch();

  return (
    <Message type="warn">
      Unable to retrieve your allocations.{' '}
      <a
        href="#"
        style={{ color: '#9d85ef' }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          dispatch({ type: 'GET_ALLOCATIONS' });
        }}
      >
        Try reloading the page.
      </a>
    </Message>
  );
};

export const AllocationsTable = ({ page }) => {
  const { errors } = useSelector((state) => state.allocations);
  const tableAttributes = useAllocations(page);
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable(...tableAttributes);
  return (
    <table
      {...getTableProps()}
      // Emulate <InfiniteScrollTable> and its use of `o-fixed-header-table`
      // TODO: Create global table styles & Make <InfiniteScrollTable> use them
      className={`allocations-table InfiniteScrollTable o-fixed-header-table ${styles.root}`}
    >
      <thead>
        {headerGroups.map((headerGroup) => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map((column) => (
              <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                {column.render('Header')}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.length ? (
          rows.map((row) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map((cell) => (
                  <td
                    {...cell.getCellProps({
                      className: cell.column.className,
                    })}
                  >
                    {cell.render('Cell')}
                  </td>
                ))}
              </tr>
            );
          })
        ) : (
          <tr>
            <td colSpan={headerGroups[0].headers.length}>
              <center style={{ padding: '1rem' }}>
                {errors.listing ? (
                  <ErrorMessage />
                ) : (
                  <span>
                    You have no
                    {` ${page[0].toLocaleUpperCase()}${page.slice(1)} `}
                    allocations.
                  </span>
                )}
              </center>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};
AllocationsTable.propTypes = {
  page: string.isRequired,
};
