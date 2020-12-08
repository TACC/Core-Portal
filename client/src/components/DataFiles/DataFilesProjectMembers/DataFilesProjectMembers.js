import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { InfiniteScrollTable, LoadingSpinner } from '_common';
import { useDispatch, useSelector } from 'react-redux';
import { Input, Label, Button } from 'reactstrap';
import './DataFilesProjectMembers.module.scss';
import './DataFilesProjectMembers.scss';

const DataFilesProjectMembers = ({ members, onAdd, onRemove, loading }) => {
  const dispatch = useDispatch();

  const userSearchResults = useSelector(state => state.users.search.users);

  const [selectedUser, setSelectedUser] = useState('');

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
        el.row.original.access !== 'owner' ? (
          <Button
            onClick={e => onRemove(el.row.original)}
            color="link"
            styleName="remove-member"
            disabled={loading}
          >
            <h6>Remove</h6>
          </Button>
        ) : null
    }
  ];

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
        tableColumns={columns}
        tableData={members}
        styleName="member-list"
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
  loading: PropTypes.bool
};

DataFilesProjectMembers.defaultProps = {
  loading: false
};

export default DataFilesProjectMembers;
