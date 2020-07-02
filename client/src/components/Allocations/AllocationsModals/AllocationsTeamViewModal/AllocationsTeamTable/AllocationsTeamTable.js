import React from 'react';
import { string, func, shape, arrayOf, object } from 'prop-types';
import { Table } from 'reactstrap';
import { useTable } from 'react-table';
import { capitalize } from 'lodash';

const UserCell = ({ cell: { value } }) => {
  const { firstName, lastName } = value;
  return (
    <span className="user-name">
      {`${capitalize(firstName)} ${capitalize(lastName)}`}
    </span>
  );
};
UserCell.propTypes = {
  cell: shape({
    value: shape({
      firstName: string.isRequired,
      lastName: string.isRequired
    }).isRequired
  }).isRequired
};

const AllocationsTeamTable = ({ rawData, clickHandler, visible }) => {
  const data = React.useMemo(() => rawData, [rawData]);
  const columns = React.useMemo(
    () => [
      {
        Header: 'name',
        accessor: row => row,
        UserCell
      }
    ],
    [rawData]
  );
  const { getTableProps, getTableBodyProps, rows, prepareRow } = useTable({
    columns,
    data
  });
  return (
    <Table hover responsive borderless size="sm" {...getTableProps()}>
      <tbody {...getTableBodyProps()}>
        {rows.map(row => {
          prepareRow(row);
          return (
            <tr
              {...row.getRowProps({
                className: row.values.name === visible ? 'active-user' : '',
                onClick: () => {
                  clickHandler(row.values.name);
                }
              })}
            >
              {row.cells.map(cell => (
                <td {...cell.getCellProps()}>{cell.render('UserCell')}</td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
};
AllocationsTeamTable.propTypes = {
  rawData: arrayOf(object),
  clickHandler: func.isRequired,
  visible: shape({
    firstName: string.isRequired,
    lastName: string.isRequired,
    email: string.isRequired,
    username: string.isRequired
  })
};
AllocationsTeamTable.defaultProps = { visible: {}, rawData: [] };
export default AllocationsTeamTable;
