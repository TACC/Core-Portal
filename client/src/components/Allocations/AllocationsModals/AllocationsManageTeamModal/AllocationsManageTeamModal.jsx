import React, { useCallback, useEffect } from 'react';
import { Modal, ModalHeader, ModalBody, Table, Button } from 'reactstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useTable } from 'react-table';
import { LoadingSpinner, UserSearchbar, Message } from '_common';
import styles from './AllocationsManageTeamModal.module.scss';

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
          switch (role) {
            case 'PI':
              return 'Principal Investigator';
            case 'Delegate':
              return 'Allocation Manager';
            default:
              return 'Member';
          }
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
    <Table hover responsive borderless size="sm" {...getTableProps()}>
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

const AllocationsManageTeamModal = ({
  isOpen,
  toggle,
  projectId,
  viewToggle,
}) => {
  const dispatch = useDispatch();

  const { teams, loadingUsernames, search } = useSelector(
    (state) => state.allocations
  );
  useEffect(() => {
    dispatch({
      type: 'ALLOCATION_OPERATION_REMOVE_USER_INIT',
    });
  }, [isOpen]);

  const isLoading =
    loadingUsernames[projectId] && loadingUsernames[projectId].loading;

  const onAdd = useCallback(
    (newUser) => {
      dispatch({
        type: 'ADD_USER_TO_TAS_PROJECT',
        payload: {
          projectId,
          id: newUser.user.username,
        },
      });
    },
    [projectId, dispatch]
  );

  const onChange = useCallback(
    (query) => {
      dispatch({
        type: 'GET_USERS_FROM_SEARCH',
        payload: {
          term: query,
        },
      });
    },
    [dispatch]
  );

  return (
    <Modal isOpen={isOpen} toggle={toggle} className={styles.root}>
      <ModalHeader>
        Manage Team
        <div>
          <Button className="btn btn-sm p-0" color="link" onClick={viewToggle}>
            View Team
          </Button>
        </div>
      </ModalHeader>
      <ModalBody className="p-2">
        <UserSearchbar
          members={teams[projectId]}
          onAdd={onAdd}
          addDisabled={isLoading}
          searchDisable={isLoading}
          onChange={onChange}
          searchResults={search.results}
          placeholder="Search by username, email, or last name"
        />
        <div className={styles.listingWrapper}>
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <AllocationsManageTeamTable
              rawData={teams[projectId]}
              projectId={projectId}
            />
          )}
        </div>
      </ModalBody>
    </Modal>
  );
};

export default AllocationsManageTeamModal;
