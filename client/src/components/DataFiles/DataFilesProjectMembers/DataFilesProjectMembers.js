import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { InfiniteScrollTable, LoadingSpinner } from '_common';
import { useDispatch, useSelector } from 'react-redux';
import { Input, Label, Button } from 'reactstrap';
import './DataFilesProjectMembers.module.scss';
import './DataFilesProjectMembers.scss';

const DataFilesProjectMembers = ({ members, onAdd, onRemove, onTransfer, mode, loading }) => {
  const dispatch = useDispatch();

  const userSearchResults = useSelector(state => state.users.search.users);

  const [selectedUser, setSelectedUser] = useState('');

  const [transferUser, setTransferUser] = useState(null);

  /* eslint-disable */
  // The backend needs to camelcase this
  const formatUser = ({ first_name, last_name, email }) => 
    `${first_name} ${last_name} (${email})`;
  /* eslint-enable */

  const userSearch = e => {
    // Try to set the selectedUser to something matching current search results
    setSelectedUser(
      userSearchResults.find(user => formatUser(user) === e.target.value)
    );
    if (!selectedUser) {
      dispatch({
        type: 'USERS_SEARCH',
        payload: {
          q: e.target.value
        }
      });
    }
  };

  const confirmTransfer = useCallback(
    () => {
      onTransfer(transferUser);
      setTransferUser(null);
    },
    [transferUser, setTransferUser]
  );

  const alreadyMember = user =>
    members.some(
      existingMember => existingMember.user.username === user.username
    );

  const columns = [
    {
      Header: 'Members',
      headerStyle: { textAlign: 'left' },
      accessor: 'user',
      Cell: el => (
        <span>
          {el.value ? `${el.value.first_name} ${el.value.last_name}` : ''}
        </span>
      )
    },
    {
      Header: 'Access',
      accessor: 'access',
      Cell: el => <span styleName="access">{el.value}</span>
    },
    {
      Header: loading ? (
        <LoadingSpinner
          placement="inline"
          className="project-members__loading"
        />
      ) : (
        ''
      ),
      headerStyle: { textAlign: 'left' },
      accessor: 'username',
      Cell: el =>
        <>
          {
            mode === 'addremove' && el.row.original.access !== 'owner' ? (
              <Button
                onClick={e => onRemove(el.row.original)}
                color="link"
                styleName="member-action"
                disabled={loading}
              >
                <h6>Remove</h6>
              </Button>
            ) : null
          }
          {
            mode === 'transfer' && el.row.original.access !== 'owner' && transferUser === null ? (
              <Button onClick={() => setTransferUser(el.row.original.user)}>Transfer Ownership</Button>
            ) : null
          }
        </>
    }
  ];

  const transferColumns = [
    {
      Header: 'Members',
      headerStyle: { textAlign: 'left' },
      accessor: 'user',
      Cell: el => (
        <span>
          {el.value ? `${el.value.first_name} ${el.value.last_name}` : ''}
        </span>
      )
    },
    {
      Header: loading ? (
        <LoadingSpinner
          placement="inline"
          className="project-members__loading"
        />
      ) : (
        ''
      ),
      headerStyle: { textAlign: 'left' },
      accessor: 'username',
      Cell: el => mode === 'transfer' && el.row.original.user == transferUser ? (
        <div styleName="confirm-controls">
          <span>Confirm Ownership Transfer:</span>
          <Button onClick={confirmTransfer}>Confirm</Button>
          <Button onClick={() => setTransferUser(null)} color="link" styleName="member-action">
            <h6>Cancel</h6>
          </Button>
        </div>
       ) : null
    }
  ];

  const isTransferring = mode === 'transfer' && transferUser;

  return (
    <div styleName="root">
      <Label className="form-field__label" size="sm">
        Add Member
      </Label>
      <div>
        <div className="input-group" styleName="member-search">
          <div className="input-group-prepend">
            <Button
              styleName="add-button"
              onClick={() => onAdd({ user: selectedUser, access: 'edit' })}
              disabled={!selectedUser || loading || alreadyMember(selectedUser)}
            >
              Add
            </Button>
          </div>
          <Input
            list="user-search-list"
            type="text"
            onChange={e => userSearch(e)}
          />
          <datalist id="user-search-list">
            {/* eslint-disable */
              // Need to replace this component with a generalized solution from FP-743
              userSearchResults
                .filter(user => !alreadyMember(user))
                .map(user => (
                <option value={formatUser(user)} key={user.username} />
              ))
              /* eslint-enable */
            }
          </datalist>
        </div>
      </div>
      <InfiniteScrollTable
        tableColumns={isTransferring ? transferColumns : columns}
        tableData={members}
        styleName={isTransferring ? "transfer-list" : "member-list"}
        columnMemoProps={[mode, transferUser]}
      />
    </div>
  );
};

DataFilesProjectMembers.propTypes = {
  members: PropTypes.arrayOf(
    PropTypes.shape({
      username: PropTypes.string,
      last_name: PropTypes.string,
      first_name: PropTypes.string,
      email: PropTypes.string
    })
  ).isRequired,
  onAdd: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onTransfer: PropTypes.func,
  mode: PropTypes.string,
  loading: PropTypes.bool
};

DataFilesProjectMembers.defaultProps = {
  onTransfer: () => {},
  mode: 'addremove',
  loading: false
};

export default DataFilesProjectMembers;
