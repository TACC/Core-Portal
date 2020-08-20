import React, { useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTable } from 'react-table';
import { LoadingSpinner, Message } from '_common';
import { Display, Operational, Load } from './SystemMonitorCells';
import './SystemMonitor.module.scss';
import './SystemMonitor.css';

const SystemsList = () => {
  const systemList = useSelector(state => state.systemMonitor.list);
  const loadingError = useSelector(state => state.systemMonitor.error);
  const data = useMemo(() => systemList, []);
  const columns = useMemo(
    () => [
      {
        accessor: 'display_name',
        Header: 'Name',
        Cell: Display
      },
      {
        accessor: 'is_operational',
        Header: 'Status',
        Cell: Operational,
        styleName: 'status'
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

  if (loadingError) {
    return (
      <Message type="warn" styleName="error">
        Unable to gather system information
      </Message>
    );
  }

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
    <table {...getTableProps()} styleName="root" className="multi-system">
      <thead>
        {headerGroups.map(headerGroup => (
          <tr {...headerGroup.getHeaderGroupProps()} styleName="header">
            {headerGroup.headers.map(column => (
              <th key={column.Header}>{column.render('Header')}</th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()} styleName="rows">
        {rows.length ? (
          rows.map((row, idx) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map(cell => (
                  <td
                    {...cell.getCellProps({ test: cell.column.testProp })}
                    styleName={cell.column.styleName}
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
