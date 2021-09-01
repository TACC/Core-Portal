import React, { useCallback } from 'react';
import { Modal, ModalHeader, ModalBody, Table, Button } from 'reactstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useTable } from 'react-table';
import { LoadingSpinner, UserSearchbar } from '_common';
import './AllocationsManageTeamModal.module.scss';

const AllocationsManageTeamTable = ({ rawData }) => {
  const data = React.useMemo(() => rawData, [rawData]);
  const columns = React.useMemo(
    () => [
      {
        Header: 'Members',
        Cell: el => {
          const user = el.row.original;
          return (
            <span>
              <strong>{`${user.firstName} ${user.lastName}`}</strong>
              {` ${user.username} (${user.email})`}
            </span>
          );
        }
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
        }
      },
      {
        Header: '',
        accessor: 'id',
        Cell: ({ value }) => (
          <Button
            color="link"
            onClick={() => {
              console.log(value);
            }}
          >
            Remove
          </Button>
        )
      }
    ],
    [rawData]
  );
  const {
    getTableProps,
    getTableBodyProps,
    rows,
    prepareRow,
    headerGroups
  } = useTable({
    columns,
    data
  });
  return (
    <Table hover responsive borderless size="sm" {...getTableProps()}>
      <thead>
        {headerGroups.map(headerGroup => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map(column => (
              <th {...column.getHeaderProps()}>{column.render('Header')}</th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.map(row => {
          prepareRow(row);
          return (
            <tr>
              {row.cells.map(cell => (
                <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
};

const AllocationsManageTeamModal = ({ isOpen, toggle, projectId }) => {
  const dispatch = useDispatch();
  const { teams, loadingUsernames, search } = useSelector(
    state => state.allocations
  );

  const isLoading =
    loadingUsernames[projectId] && loadingUsernames[projectId].loading;

  const onAdd = useCallback(
    newUser => {
      dispatch({
        type: 'ADD_USER_TO_TAS_PROJECT',
        payload: {
          projectId,
          id: newUser.user.username
        }
      });
    },
    [projectId, dispatch]
  );

  const onChange = useCallback(
    query => {
      dispatch({
        type: 'GET_USERS_FROM_SEARCH',
        payload: {
          term: query
        }
      });
    },
    [dispatch]
  );

  return (
    <Modal isOpen={isOpen} toggle={toggle} styleName="root">
      <ModalHeader>Manage Team</ModalHeader>
      <ModalBody className="p-2">
        <UserSearchbar
          members={teams[projectId]}
          onAdd={onAdd}
          addDisabled={isLoading}
          searchDisable={isLoading}
          onChange={onChange}
          searchResults={search.results}
        />
        <div styleName="listing-wrapper">
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <AllocationsManageTeamTable rawData={teams[projectId]} />
          )}
        </div>
      </ModalBody>
    </Modal>
  );
};

export default AllocationsManageTeamModal;
