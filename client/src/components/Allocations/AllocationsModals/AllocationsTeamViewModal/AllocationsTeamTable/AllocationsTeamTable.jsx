import React from 'react';
import { string, func, shape, arrayOf } from 'prop-types';
import { Table } from 'reactstrap';
import { useTable } from 'react-table';
import { capitalize } from 'lodash';
import styles from './AllocationsTeamTable.module.scss';

const AllocationsTeamTable = ({ rawData, clickHandler, visible }) => {
  const data = React.useMemo(() => rawData, [rawData]);
  const columns = React.useMemo(
    () => [
      {
        Header: 'listing',
        accessor: (el) => el,
        Cell: (el) => {
          const { firstName, lastName } = el.value;
          return (
            <span className={styles.content}>
              {capitalize(firstName)} {capitalize(lastName)}
            </span>
          );
        },
      },
    ],
    [rawData]
  );
  const getStyleName = (listing) => {
    if (visible && listing.username === visible.username)
      return styles['active-user'];
    return styles['row'];
  };
  const { getTableProps, getTableBodyProps, rows, prepareRow } = useTable({
    columns,
    data,
  });
  return (
    <Table hover responsive borderless size="sm" {...getTableProps()}>
      <tbody {...getTableBodyProps()}>
        {rows.map((row) => {
          prepareRow(row);
          return (
            <tr
              {...row.getRowProps({
                onClick: () => {
                  clickHandler(row.values.listing);
                },
              })}
              className={getStyleName(row.values.listing)}
            >
              {row.cells.map((cell) => (
                <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
};
AllocationsTeamTable.propTypes = {
  rawData: arrayOf(shape({})),
  clickHandler: func.isRequired,
  visible: shape({
    firstName: string.isRequired,
    lastName: string.isRequired,
    email: string.isRequired,
    username: string.isRequired,
  }),
};
AllocationsTeamTable.defaultProps = { visible: {}, rawData: [] };
export default AllocationsTeamTable;
