import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { InfiniteScrollTable, LoadingSpinner } from '_common'; 
import { useDispatch, useSelector } from 'react-redux'
import {
  Input,
  Label,
  Button,
} from 'reactstrap';
import './DataFilesProjectMembers.module.scss';

const DataFilesProjectMembers = ({ members, onAdd, onRemove }) => {
  const dispatch = useDispatch();

  const userSearchResults = useSelector(state => state.users.search.users);

  const [ selectedUser, setSelectedUser ] = useState('');

  const formatUser = ({ first_name, last_name, email}) => `${first_name} ${last_name} (${email})`;

  const userSearch = (e) => {
    // Try to set the selectedUser to something matching current search results
    setSelectedUser(userSearchResults.find(user => formatUser(user) === e.target.value));
    if (!selectedUser) {
      dispatch({
        type: 'USERS_SEARCH',
        payload: {
          q: e.target.value
        }
      });
    }
  }

  const addCallback = () => {
    onAdd(selectedUser);
  }

  const removeCallback = (e, user) => {
    e.preventDefault();
    onRemove(user)
  }

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
      Header: '',
      headerStyle: { textAlign: 'left' },
      accessor: 'username',
      Cell: el => (
        el.row.original.access !== 'owner' 
          ? <Link onClick={e => onRemove(e, el.row.original)}>Remove</Link>
          : null
      )
    }
  ];

  return (
    <div styleName="root">
      <Label className="form-field__label" size="sm">Add Member</Label>
      <div>
        <div className="input-group" styleName="member-search">
          <div className="input-group-prepend">
            <Button styleName="add-button" onClick={addCallback} disabled={!selectedUser}>
              Add
            </Button>
          </div>
          <Input list="user-search-list" type="text" onChange={e => userSearch(e)} />
          <datalist id="user-search-list">
            {
              userSearchResults.map(user => (
                <option value={formatUser(user)} key={user.username} />
              ))
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


export default DataFilesProjectMembers;
