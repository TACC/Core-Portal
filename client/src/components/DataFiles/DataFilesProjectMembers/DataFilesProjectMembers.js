import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { InfiniteScrollTable, LoadingSpinner, DropdownSelector } from '_common'; 
import { useDispatch, useSelector } from 'react-redux'
import {
  FormGroup,
  Input,
  Label,
  Button,
  DropdownMenu,
  DropdownItem
} from 'reactstrap';
import {v4 as uuidv4 } from 'uuid';
import './DataFilesProjectMembers.module.scss';

const DataFilesProjectMembers = () => {
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

  const onAdd = (e) => {
    console.log(selectedUser);
    e.preventDefault();
  }

  const projectMembers = [
    {
      name: 'Joon-Yee Chuah',
      access: 'owner',
      username: 'jchuah'
    }
  ]

  const columns = [
    {
      Header: 'Members',
      headerStyle: { textAlign: 'left' },
      accessor: 'name',
      Cell: el => (
        <span>
          {el.value}
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
      Cell: el => <span>Remove</span>
    }
  ];

  return (
    <div styleName="root">
      <Label className="form-field__label" size="sm">Add Member</Label>
      <div>
        <div className="input-group" styleName="member-search">
          <div className="input-group-prepend">
            <Button styleName="add-button" onClick={onAdd} disabled={!selectedUser}>
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
        tableData={projectMembers}
        styleName="member-list"
      />
    </div>
  );
};


export default DataFilesProjectMembers;
