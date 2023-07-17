import React, { useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTable } from 'react-table';
import { LoadingSpinner, Message } from '_common';
import { Display, Operational, Load } from './SystemMonitorCells';
import PropTypes from 'prop-types';

import styles from './SystemMonitor.module.scss';

const SystemsList = ({ system }) => {
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
        accessor: ({ jobs }) => (jobs ? jobs.running : '--'),
        Header: 'Running Jobs',
      },
      {
        accessor: ({ jobs }) => (jobs ? jobs.queued : '--'),
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
        {headerGroups.map((headerGroup) => (
          <tr
            {...headerGroup.getHeaderGroupProps()}
            className={styles['header']}
          >
            {headerGroup.headers.map((column) => (
              <th key={column.Header}>{column.render('Header')}</th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()} className={styles['rows']}>
        {rows.length ? (
          rows.map((row, idx) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map((cell) => (
                  <td {...cell.getCellProps({ test: cell.column.testProp })}>
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

SystemsList.propTypes = {
  system: PropTypes.string,
};
SystemsList.defaultProps = {
  system: '',
};

const SystemMonitorView = ({ system }) => {
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
SystemMonitorView.defaultProps = {
  system: '',
};

export default SystemMonitorView;
