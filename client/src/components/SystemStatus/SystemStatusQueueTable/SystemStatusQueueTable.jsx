import React, { useMemo, useState, useEffect } from 'react';
import { useTable, useSortBy } from 'react-table';
import { useSelector, useDispatch } from 'react-redux';
import Pill from '_common/Pill';

import styles from './SystemStatusQueueTable.module.scss';
import {
  LoadingSpinner,
  Section,
  SectionTableWrapper,
  SectionMessage,
} from '_common';
import { useSystemQueue } from 'hooks/system-monitor/useSystemMonitor';

export const SystemStatusQueueTable = ({ system }) => {
  const [systemQueues, setSystemQueues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      setIsLoading(true);
      const details = system ? await useSystemQueue(system.hostname) : [];
      setSystemQueues(details);
      setIsLoading(false);
    };
    fetchStatus();
  }, [system]);

  const columns = useMemo(
    () => [
      {
        accessor: 'name',
        Header: 'Queue',
      },
      {
        accessor: 'down',
        Header: 'Status',
        Cell: ({ cell: { value } }) => {
          const { down } = value;
          return down ? (
            <Pill type="warning">Closed</Pill>
          ) : (
            <Pill type="success">Open</Pill>
          );
        },
      },
      {
        accessor: 'free',
        Header: 'Idle Nodes',
      },
      {
        accessor: ({ running }) => (running ? running : ' 0 '),
        Header: 'Running Jobs',
      },
      {
        accessor: ({ waiting }) => (waiting ? waiting : ' 0 '),
        Header: 'Waiting Jobs',
      },
    ],
    []
  );

  const { getTableProps, getTableBodyProps, rows, prepareRow, headerGroups } =
    useTable({ columns, data: systemQueues ?? [] });

  if (isLoading) {
    return <LoadingSpinner />;
  }
  return (
    <table
      {...getTableProps()}
      className={`InfiniteScrollTable o-fixed-header-table ${styles['root']}`}
    >
      <thead>
        {headerGroups.map((headerGroup) => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map((column) => (
              <th className={styles['header']} key={column.id}>
                {column.render('Header')}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.length ? (
          rows.map((row, idx) => {
            prepareRow(row);
            return (
              <tr className={styles['rows']} {...row.getRowProps()}>
                {row.cells.map((cell) => (
                  <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                ))}
              </tr>
            );
          })
        ) : (
          <tr>
            <td colSpan="99">
              <Section className={styles['error']}>
                <SectionMessage type="info">
                  Unable to gather system queue information
                </SectionMessage>
              </Section>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};
