import React from 'react';
import {
  Table,
  Button,
} from 'reactstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useTable } from 'react-table';
import { LoadingSpinner, Message, DropdownSelector } from '_common';
import styles from './AllocationsManageTeamTable.module.scss';

const AllocationsManageTeamTable = ({ rawData, projectId }) => {
  const dispatch = useDispatch();
  const { removingUserOperation } = useSelector((state) => state.allocations);
  const data = React.useMemo(() => rawData, [rawData]);
  const columns = React.useMemo(
    () => [
      {
        Header: 'Members',
        Cell: (el) => {
          const user = el.row.original;
          return (
            <span>
              <strong>{`${user.firstName} ${user.lastName}`}</strong>
              {` ${user.username} (${user.email})`}
            </span>
          );
        },
      },
      {
        Header: 'Role',
        accessor: ({ role }) => {
          /*const changeUserRole = (user,role) => {
            dispatch({
              type: ##UPDATE_USER_ROLE_IN_TAS_PROJECT,
              payload: user, role
            })
          }*/
          const allocationRoles = {
            'Standard':'Member', 
            'Delegate':'Allocation Manager', 
            'PI':'Principal Investigator'
          }
          console.log(role);
          return (
            <div>
                <DropdownSelector
                //onChange={(e) => changeUserRole(user, e.target.value)}
                value=""
                >
                  <option value="">{allocationRoles[role]}</option>
                  {Object.keys(allocationRoles).filter(
                    (userRole) =>
                    userRole !== role).map((userRole) =>
                      <option value="">{allocationRoles[userRole]}</option>
                    ) 
                  }
                </DropdownSelector>
            </div>
          )
        },
      },
      {
        Header: '',
        accessor: 'id',
        Cell: (el) => {
          const deleteOperationOccuring =
            removingUserOperation.loading &&
            el.row.original.username === removingUserOperation.userName;
          const deleteOperationFailed =
            removingUserOperation.error &&
            el.row.original.username === removingUserOperation.userName;
          const removable =
            !deleteOperationOccuring && el.row.original.role !== 'PI';

          return (
            <>
              {deleteOperationFailed && (
                <Message type="error">Something went wrong.</Message>
              )}
              {deleteOperationOccuring && <LoadingSpinner placement="inline" />}
              {removable && (
                <Button
                  color="link"
                  disabled={removingUserOperation.loading}
                  onClick={(e) => {
                    dispatch({
                      type: 'REMOVE_USER_FROM_TAS_PROJECT',
                      payload: {
                        projectId,
                        id: el.row.original.username,
                      },
                    });
                  }}
                >
                  Remove
                </Button>
              )}
            </>
          );
        },
      },
    ],
    [rawData, removingUserOperation]
  );
  const { getTableProps, getTableBodyProps, rows, prepareRow, headerGroups } =
    useTable({
      columns,
      data,
    });
  return (
    <Table  hover responsive borderless size="sm" className={styles['manage-team-table']} {...getTableProps()}>
      <thead>
        {headerGroups.map((headerGroup) => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map((column) => (
              <th {...column.getHeaderProps()}>{column.render('Header')}</th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.map((row) => {
          prepareRow(row);
          return (
            <tr>
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

export default AllocationsManageTeamTable;