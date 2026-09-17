import React, { useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTable } from 'react-table';
import { LoadingSpinner, Message } from '_common';
import { Display, Operational, Load } from './SystemMonitorCells';
import PropTypes from 'prop-types';

import styles from './SystemMonitor.module.scss';

const SystemsList = ({ system = '' }) => {
  let systemList = useSelector((state) => state.systemMonitor.list);

  systemList = system
    ? systemList.filter((sys) => sys.hostname === system)
    : systemList;

  const loadingError = useSelector((state) => state.systemMonitor.error);
  const data = systemList;
  const columns = useMemo(
    () => [
      {
        accessor: 'display_name',
        Header: 'Name',
        Cell: Display,
      },
      {
        accessor: 'is_operational',
        Header: 'System Status',
        Cell: Operational,
      },
      {
        accessor: 'load_percentage',
        Header: 'Load',
        Cell: Load,
      },
      {
        accessor: ({ jobs }) => (jobs?.running ? jobs.running : 0),
        Header: 'Running Jobs',
      },
      {
        accessor: ({ jobs }) => (jobs?.queued ? jobs.queued : 0),
        Header: 'Waiting Jobs',
      },
    ],
    []
  );

  const initialTableState = system ? { hiddenColumns: ['display_name'] } : {};

  if (loadingError) {
    return (
      <Message type="warn" className={styles['error']}>
        Unable to gather system information
      </Message>
    );
  }

  const { getTableProps, getTableBodyProps, rows, prepareRow, headerGroups } =
    useTable({
      columns,
      data,
      initialState: initialTableState,
    });
  return (
    <table
      {...getTableProps()}
      // Emulate <InfiniteScrollTable> and its use of `o-fixed-header-table`
      // TODO: Create global table styles & Make <InfiniteScrollTable> use them
      className={`multi-system InfiniteScrollTable o-fixed-header-table ${
        system ? styles['root-no-system-name'] : styles['root']
      }`}
    >
      <thead>
        {headerGroups.map((headerGroup) => {
          const { key: headerGroupKey, ...headerGroupProps } =
            headerGroup.getHeaderGroupProps();
          return (
            <tr
              key={headerGroupKey}
              {...headerGroupProps}
              className={styles['header']}
            >
              {headerGroup.headers.map((column) => (
                <th key={column.Header}>{column.render('Header')}</th>
              ))}
            </tr>
          );
        })}
      </thead>
      <tbody {...getTableBodyProps()} className={styles['rows']}>
        {rows.length ? (
          rows.map((row) => {
            prepareRow(row);
            const { key: rowKey, ...rowProps } = row.getRowProps();
            return (
              <tr key={rowKey} {...rowProps}>
                {row.cells.map((cell) => {
                  const { key: cellKey, ...cellProps } = cell.getCellProps({
                    test: cell.column.testProp,
                  });
                  return (
                    <td key={cellKey} {...cellProps}>
                      {cell.render('Cell')}
                    </td>
                  );
                })}
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

SystemsList.propTypes = {
  system: PropTypes.string,
};

const SystemMonitorView = ({ system = '' }) => {
  const { loading } = useSelector((state) => state.systemMonitor);
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch({ type: 'GET_SYSTEM_MONITOR' });
  }, [dispatch]);
  if (loading) {
    return <LoadingSpinner />;
  }

  return <SystemsList system={system} />;
};

SystemMonitorView.propTypes = {
  system: PropTypes.string,
};

export default SystemMonitorView;
