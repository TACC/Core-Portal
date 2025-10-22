import React from 'react';
import { useTable } from 'react-table';
import { capitalize } from 'lodash';
import { useLocation } from 'react-router-dom';
import { arrayOf, shape, string } from 'prop-types';
import { getSystemName } from 'utils/systems';
import styles from './AllocationsUsageTable.module.css';

const AllocationsUsageTable = ({ rawData }) => {
  const location = useLocation();
  const data = React.useMemo(() => {
    if (location.pathname.includes('approved')) {
      return rawData.filter((e) => e.status === 'Active');
    }
    return rawData.filter((e) => e.status === 'Inactive');
  }, [rawData]);
  const columns = React.useMemo(
    () => [
      {
        Header: 'System',
        accessor: (entry) => {
          const system = getSystemName(entry.resource);
          const sysNum = system.match(/\d+$/);
          const sysName = capitalize(system.replace(/[0-9]/g, ''));
          if (sysNum) {
            return `${sysName} ${sysNum[0]}`;
          }
          return sysName;
        },
      },
      { Header: 'Individual Usage', accessor: 'usage' },
      {
        Header: '% of Allocation',
        accessor: (entry) => {
          if (entry.percentUsed >= 1) {
            return `${entry.percentUsed.toFixed(3)}%`;
          }
          if (entry.percentUsed === 0) return '0%';
          return `< 1%`;
        },
      },
    ],
    []
  );
  const { getTableBodyProps, rows, prepareRow, headerGroups, getTableProps } =
    useTable({
      columns,
      data,
    });
  return (
    <div className={styles.container}>
      <table {...getTableProps()} className={styles.root}>
        <thead className={styles.header}>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps()}>{column.render('Header')}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()} className={styles.body}>
          {rows.map((row) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()} className={styles.row}>
                {row.cells.map((cell) => (
                  <td {...cell.getCellProps()} className={styles.cell}>
                    <span className={styles.content}>
                      {cell.render('Cell')}
                    </span>
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
AllocationsUsageTable.propTypes = {
  rawData: arrayOf(
    shape({
      resource: string,
      usage: string,
    })
  ),
};
AllocationsUsageTable.defaultProps = { rawData: [] };

export default AllocationsUsageTable;
