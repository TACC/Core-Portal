import React, { useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTable } from 'react-table';
import { LoadingSpinner } from '_common';
import { Display, Operational, Load } from './SystemMonitorCells';
import './SystemMonitor.scss';

const SystemsList = () => {
  const systemList = useSelector(state => state.systemMonitor.list);
  const data = useMemo(() => systemList, []);
  const columns = useMemo(
    () => [
      {
        accessor: 'display_name',
        Header: 'Name',
        Cell: Display,
        className: 'left-aligned'
      },
      {
        accessor: 'is_operational',
        Header: 'Status',
        Cell: Operational,
        className: 'operational-cell left-aligned'
      },
      {
        accessor: 'load_percentage',
        Header: 'Load',
        Cell: Load
      },
      {
        accessor: ({ jobs }) => (jobs ? jobs.running : '--'),
        Header: 'Running'
      },
      {
        accessor: ({ jobs }) => (jobs ? jobs.queued : '--'),
        Header: 'Queued'
      }
    ],
    []
  );
  const {
    getTableProps,
    getTableBodyProps,
    rows,
    prepareRow,
    headerGroups
  } = useTable({
    columns,
    data
  });
  return (
    <table
      {...getTableProps({
        className: 'multi-system system-monitor'
      })}
    >
      <thead>
        {headerGroups.map(headerGroup => (
          <tr
            {...headerGroup.getHeaderGroupProps({
              className: 'system-monitor-header'
            })}
          >
            {headerGroup.headers.map(column => (
              <th key={column.Header}>{column.render('Header')}</th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.length ? (
          rows.map((row, idx) => {
            prepareRow(row);
            const className = idx % 2 === 0 ? 'odd-row' : null;
            return (
              <tr
                {...row.getRowProps({
                  className
                })}
              >
                {row.cells.map(cell => (
                  <td
                    {...cell.getCellProps({
                      className: cell.column.className,
                      test: cell.column.testProp
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
            <td colSpan="5">No systems being monitored</td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

const SystemMonitorView = () => {
  const { loading } = useSelector(state => state.systemMonitor);
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch({ type: 'GET_SYSTEM_MONITOR' });
  }, [dispatch]);
  if (loading) {
    return <LoadingSpinner />;
  }
  return <SystemsList />;
};

export default SystemMonitorView;
