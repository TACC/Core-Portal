import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Button, InfiniteScrollTable, LoadingSpinner } from '_common';
import { useDispatch, useSelector } from 'react-redux';
import { Input, Label } from 'reactstrap';
import { SystemRoleSelector, ProjectRoleSelector } from './_cells';
import styles from './DataFilesProjectMembers.module.scss';
import { useSystemRole } from './_cells/SystemRoleSelector';
import './DataFilesProjectMembers.scss';

const DataFilesProjectMembers = ({
  projectId,
  members,
  onAdd,
  onRemove,
  onTransfer,
  mode,
  loading,
}) => {
  const dispatch = useDispatch();

  const userSearchResults = useSelector((state) => state.users.search.users);
  const authenticatedUser = useSelector(
    (state) => state.authenticatedUser.user.username
  );
  const { query: authenticatedUserQuery } = useSystemRole(
    projectId ?? null,
    authenticatedUser ?? null
  );

  const canEditSystem = ['OWNER', 'ADMIN'].includes(
    authenticatedUserQuery?.data?.role
  );

  const readOnlyTeam = useSelector((state) => {
    const projectSystem = state.systems.storage.configuration.find(
      (s) => s.scheme === 'projects'
    );

    return projectSystem?.readOnly || !canEditSystem;
  });

  const [selectedUser, setSelectedUser] = useState('');

  const [inputUser, setInputUser] = useState('');

  const [transferUser, setTransferUser] = useState(null);

  /* eslint-disable */
  // The backend needs to camelcase this
  const formatUser = ({ first_name, last_name, email }) =>
    `${first_name} ${last_name} (${email})`;
  /* eslint-enable */

  const userSearch = (e) => {
    setInputUser(e.target.value);
    if (!e.target.value || e.target.value.trim().length < 1) return;
    // Try to set the selectedUser to something matching current search results
    setSelectedUser(
      userSearchResults.find((user) => formatUser(user) === e.target.value)
    );
    if (!selectedUser) {
      dispatch({
        type: 'USERS_SEARCH',
        payload: {
          q: e.target.value,
        },
      });
    }
  };

  const confirmTransfer = useCallback(() => {
    onTransfer(transferUser);
    setTransferUser(null);
  }, [transferUser, setTransferUser]);

  const onAddCallback = useCallback(
    (user) => {
      onAdd(user);
      setInputUser('');
    },
    [setInputUser, onAdd]
  );

  const alreadyMember = (user) => {
    return members.some(
      (existingMember) =>
        existingMember.user && existingMember.user.username === user.username
    );
  };

  const mapAccessToRoles = (access) => {
    switch (access) {
      case 'owner':
        return { projectRole: 'PI', systemRole: 'OWNER' };
      case 'edit':
        return { projectRole: 'Member', systemRole: 'USER' };
      default:
        return { projectRole: 'N/A', systemRole: 'N/A' };
    }
  };

  const memberColumn = {
    Header: 'Authors',
    headerStyle: { textAlign: 'left' },
    accessor: 'user',
    className: 'project-members__cell',
    Cell: (el) => {
      if (!el.value.first_name) return <span>{el.value.username}</span>;
      return (
        <span>
          <span
            className={styles['printed-name']}
          >{`${el.value.first_name} ${el.value.last_name}`}</span>
          {` ${el.value.username} (${el.value.email})`}
        </span>
      );
    },
  };
  const roleColumn =
    mode !== 'transfer'
      ? [
          {
            Header: 'Role',
            accessor: 'user.username',
            id: 'role',
            className: 'project-members__cell',
            show: false,
            Cell: projectId
              ? (el) => (
                  <SystemRoleSelector
                    projectId={projectId}
                    username={el.value}
                  />
                )
              : (el) => (
                  <span>
                    {mapAccessToRoles(el.row.original.access).systemRole}
                  </span>
                ),
          },
        ]
      : [];

  const columns = [
    memberColumn,
    ...roleColumn,
    {
      Header: loading ? (
        <LoadingSpinner
          placement="inline"
          className="project-members__loading"
        />
      ) : (
        ''
      ),
      accessor: 'username',
      className: 'project-members__cell',
      Cell: (el) => (
        <>
          {mode === 'addremove' &&
          el.row.original.access !== 'owner' &&
          !readOnlyTeam ? (
            <Button
              onClick={(e) => onRemove(el.row.original)}
              type="link"
              disabled={loading}
            >
              Remove
            </Button>
          ) : null}
          {mode === 'transfer' &&
          el.row.original.access !== 'owner' &&
          transferUser === null ? (
            <Button
              onClick={() => setTransferUser(el.row.original)}
              type="link"
            >
              Transfer Ownership
            </Button>
          ) : null}
        </>
      ),
    },
  ];

  const transferColumns = [
    memberColumn,
    {
      Header: loading ? (
        <LoadingSpinner
          placement="inline"
          className="project-members__loading"
        />
      ) : (
        ''
      ),
      accessor: 'username',
      className: 'project-members__cell',
      Cell: (el) =>
        mode === 'transfer' && el.row.original === transferUser ? (
          <div className={styles['confirm-controls']}>
            <span>Confirm Ownership Transfer:</span>
            <Button onClick={confirmTransfer} type="link">
              Confirm
            </Button>
            <Button onClick={() => setTransferUser(null)} type="link">
              Cancel
            </Button>
          </div>
        ) : null,
    },
  ];

  const isTransferring = mode === 'transfer' && transferUser;
  const listStyle = isTransferring ? 'transfer-list' : 'addremove-list';

  const existingMembers = members.filter((member) => member.user);

  return (
    <div className={styles.root}>
      {!readOnlyTeam && (
        <>
          <Label className="form-field__label" size="sm">
            Add Member
          </Label>

          <div className={styles['user-search']}>
            <div className={`input-group ${styles['member-search-group']}`}>
              <div className="input-group-prepend">
                <Button
                  type="primary"
                  className={styles['add-button member-search']}
                  onClick={() =>
                    onAddCallback({ user: selectedUser, access: 'edit' })
                  }
                  disabled={
                    !selectedUser ||
                    loading ||
                    alreadyMember(selectedUser) ||
                    mode === 'transfer'
                  }
                >
                  Add
                </Button>
              </div>
              <Input
                list="user-search-list"
                type="text"
                onChange={(e) => userSearch(e)}
                placeholder="Search by name"
                className={styles['member-search']}
                disabled={loading || mode === 'transfer'}
                autoComplete="false"
                value={inputUser}
              />
              <datalist id="user-search-list">
                {
                  /* eslint-disable */
                  // Need to replace this component with a generalized solution from FP-743
                  userSearchResults
                    .filter((user) => !alreadyMember(user))
                    .map((user) => (
                      <option value={formatUser(user)} key={user.username} />
                    ))
                  /* eslint-enable */
                }
              </datalist>
            </div>
          </div>
        </>
      )}
      <InfiniteScrollTable
        tableColumns={isTransferring ? transferColumns : columns}
        tableData={existingMembers}
        className={styles[listStyle]}
        columnMemoProps={[
          loading,
          mode,
          transferUser,
          authenticatedUserQuery?.data?.role,
        ]}
      />
    </div>
  );
};

DataFilesProjectMembers.propTypes = {
  projectId: PropTypes.string,
  members: PropTypes.arrayOf(
    PropTypes.shape({
      username: PropTypes.string,
      last_name: PropTypes.string,
      first_name: PropTypes.string,
      email: PropTypes.string,
    })
  ).isRequired,
  onAdd: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onTransfer: PropTypes.func,
  mode: PropTypes.string,
  loading: PropTypes.bool,
};

DataFilesProjectMembers.defaultProps = {
  onTransfer: () => {},
  mode: 'addremove',
  loading: false,
};

export default DataFilesProjectMembers;
