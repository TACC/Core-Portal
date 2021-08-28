import React, { useEffect, useState } from 'react';
import { Modal, ModalHeader, ModalBody, Table, Button } from 'reactstrap';
import { has } from 'lodash';
import { useDispatch, useSelector } from 'react-redux';
import { useTable } from 'react-table';
import { LoadingSpinner, Message } from '_common';
import './AllocationsManageTeamModal.module.scss';

const AllocationsManageTeamTable = ({ rawData, pid }) => {
  const { removingUserOperation } = useSelector(state => state.allocations);
  const dispatch = useDispatch();

  const data = React.useMemo(() => rawData, [rawData]);
  const columns = React.useMemo(
    () => [
      {
        Header: 'Members',
        accessor: ({ firstName, lastName }) => `${firstName} ${lastName}`
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
        Cell: el => {
          const deleteOperationOccuring =
            removingUserOperation.loading &&
            el.row.original.username === removingUserOperation.userName;
          const deleteOperationFailed =
            removingUserOperation.error &&
            el.row.original.username === removingUserOperation.userName;
          const removable = !deleteOperationOccuring && el.row.original.role !== 'PI';

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
                  onClick={e => {
                    dispatch({
                      type: 'REMOVE_USER_FROM_TAS_PROJECT',
                      payload: {
                        projectId: pid,
                        id: el.row.original.username
                      }
                    });
                  }}
                >
                  Remove
                </Button>
              )}
            </>
          );
        }
      }
    ],
    [rawData, removingUserOperation]
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

/**
 * Autocomplete Component
 *
 */
const UserSearch = ({ disabled, projectId }) => {
  const dispatch = useDispatch();
  const [selected, setSelected] = useState(0);
  const search = useSelector(state => state.allocations.search);
  console.log(search);
  const [show, setShowing] = useState(false);
  const [v, setTerm] = useState('');
  const [current, setCurr] = useState({});

  // useSelector(state => state)
  const handleChange = e => {
    if (v.length > 0)
      dispatch({
        type: 'GET_USERS_FROM_SEARCH',
        payload: {
          term: e.target.value
        }
      });
    setTerm(e.target.value);
    setShowing(true);
  };

  const handleClick = i => {
    setSelected(i);
    setShowing(false);
  };
  // const handleKeyDown = e => {
  //   if (e.keyCode === 13) {
  //     setSelected(0);
  //     setShowing(false);
  //     setCurr(search.results[selected]);
  //   } else if (e.keyCode === 38) {
  //     if (selected === 0) {
  //       return;
  //     }
  //     setSelected(selected - 1);
  //   }
  //   // User pressed the down arrow, increment the index
  //   else if (e.keyCode === 40) {
  //     if (selected - 1 === search.results.length) {
  //       return;
  //     }
  //     selected(selected + 1);
  //   }
  // };
  const display = show && search.results.length > 0;
  return (
    <>
      <div>
        <Button>Add</Button>
        <input
          style={{ width: '100%' }}
          type="text"
          onChange={handleChange}
          // onKeyDown={handleKeyDown}
          value={v}
          list="data"
          disabled={disabled}
        />
        {display && (
          <datalist id="data">
            {search.results.map((user, index) => {
              // TODO: Recompose
              const { firstName, lastName, username, email } = user;
              const optionValue = ` ${username} ${email}`;
              const optionLabel = `${firstName} ${lastName}`;
              return (
                <option
                  key={optionValue}
                  label={optionLabel}
                  onClick={e => {
                    e.preventDefault();
                    handleClick(index);
                    console.log('click');
                    dispatch({
                      type: 'ADD_USER_TO_TAS_PROJECT',
                      payload: {
                        projectId,
                        id: username
                      }
                    });
                  }}
                >
                  {optionValue}
                </option>
              );
            })}
          </datalist>
        )}
      </div>
      {display ? (
        <>
          {Object.keys(current).length ? JSON.stringify(current, null, 2) : ''}
        </>
      ) : (
        <div className="no-suggestions">
          <em>No suggestions available.</em>
        </div>
      )}
    </>
  );
};

const AllocationsManageTeamModal = ({ isOpen, toggle, pid, ...props }) => {
  const dispatch = useDispatch();
  const { teams, loadingUsernames, errors } = useSelector(
    state => state.allocations
  );

  useEffect(() => {
    dispatch({
      type: 'ALLOCATION_OPERATION_REMOVE_USER_INIT'
    });
  }, [isOpen]);

  console.log(pid);
  const error = has(errors.teams, pid);
  const isLoading = loadingUsernames[pid] && loadingUsernames[pid].loading;
  return (
    <Modal isOpen={isOpen} toggle={toggle} styleName="root">
      <ModalHeader>Manage Team</ModalHeader>
      <ModalBody className="p-2">
        <UserSearch disabled={isLoading} projectId={pid} />{' '}
        <div styleName="listing-wrapper">
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <AllocationsManageTeamTable rawData={teams[pid]} pid={pid} />
          )}
        </div>
      </ModalBody>
    </Modal>
  );
};

export default AllocationsManageTeamModal;
