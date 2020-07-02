import React from 'react';
import { useTable } from 'react-table';
import { capitalize } from 'lodash';
import { arrayOf, shape, string, number } from 'prop-types';
import './AllocationsUsageTable.module.scss';

const AllocationsUsageTable = ({ rawData }) => {
  const data = React.useMemo(() => rawData, [rawData]);
  const columns = React.useMemo(
    () => [
      {
        Header: 'System',
        accessor: entry => {
          const system = entry.resource.split('.')[0];
          const sysNum = system.match(/\d+$/);
          const sysName = capitalize(system.replace(/[0-9]/g, ''));
          if (sysNum) {
            return `${sysName} ${sysNum[0]}`;
          }
          return sysName;
        }
      },
      { Header: 'Usage', accessor: 'usage' },
      {
        Header: '% of Allocation',
        accessor: entry => {
          if (entry.percentUsed >= 1) {
            return `${entry.percentUsed}%`;
          }
          return `< 1%`;
        }
      }
    ],
    [rawData]
  );
  const {
    getTableBodyProps,
    rows,
    prepareRow,
    headerGroups,
    getTableProps
  } = useTable({
    columns,
    data
  });
  return (
    <div styleName="container">
      <table {...getTableProps()} styleName="root">
        <thead styleName="header">
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps()}>{column.render('Header')}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()} styleName="body">
          {rows.map(row => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()} styleName="row">
                {row.cells.map(cell => (
                  <td {...cell.getCellProps()} styleName="cell">
                    <span styleName="content">{cell.render('Cell')}</span>
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
      usage: number
    })
  ).isRequired
};

export default AllocationsUsageTable;
