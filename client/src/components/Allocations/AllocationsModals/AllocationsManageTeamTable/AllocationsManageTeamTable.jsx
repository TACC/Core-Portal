import React from 'react';
import { Table } from 'reactstrap';
import { Button } from '_common';
import { useDispatch, useSelector } from 'react-redux';
import { useTable } from 'react-table';
import { LoadingSpinner, Message, DropdownSelector } from '_common';
import styles from './AllocationsManageTeamTable.module.scss';
import TASProjectRoleSelector from './AllocationsTASProjectRoleSelector';

const AllocationsManageTeamTable = ({ rawData, projectId }) => {
  const dispatch = useDispatch();
  const { removingUserOperation } = useSelector((state) => state.allocations);
  const data = React.useMemo(() => rawData, [rawData]);
  const authenticatedUser = useSelector(
    (state) => state.authenticatedUser.user.username
  );

  const currentUserRole = data.find(u => u.username == authenticatedUser)?.role;
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
        accessor: ({id: userId, username, role}) => {

          // PIs cannot have roles changed.
          // Users cannot change their own roles.
          // Only PIs can change roles.
          if (
            role === 'PI' ||
            username === authenticatedUser ||
            currentUserRole !== 'PI'
          ) {
            switch (role) {
              case 'PI':
                return 'Principal Investigator';
              case 'Delegate':
                return 'Allocation Manager';
              case 'Standard':
              default:
                return 'Member';
            }
          }
          return (
            <TASProjectRoleSelector
              projectId={projectId}
              userId={userId}
              username={username}
              role={role}
            />
            // <div>
            //   <DropdownSelector
            //     value={selectedRole}
            //     onChange={(e) => setSelectedRole(e.target.value)}
            //   >
            //     {username !== authenticatedUser && (
            //       <option value="ADMIN">Administrator</option>
            //     )}
            //     <option value="USER">User (read/write)</option>
            //     <option value="GUEST">Guest (read only)</option>
            //   </DropdownSelector>
            //   <DropdownSelector
            //     //onChange={(e) => changeUserRole(user, e.target.value)}
            //     value=""
            //   >
            //     <option value="">{allocationRoles[role]}</option>
            //     {Object.keys(allocationRoles)
            //       .filter((userRole) => userRole !== role)
            //       .map((userRole) => (
            //         <option value="">{allocationRoles[userRole]}</option>
            //       ))}
            //   </DropdownSelector>
            // </div>
          );
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
                  type="link"
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
    <Table
      hover
      borderless
      size="sm"
      className={`${styles['manage-team-table']} o-fixed-header-table`}
      {...getTableProps()}
    >
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
            <tr key={row.id}>
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
