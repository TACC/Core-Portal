import React from 'react';
import PropTypes from 'prop-types';
import { InfiniteScrollTable, LoadingSpinner } from '_common'; 
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
  const selectUser = (user) => {
    console.log("SELECTED USER", user);
  }
  const showSearchDropdown = userSearchResults && userSearchResults.length > 0;

  const userSearch = (e) => {
    dispatch({
      type: 'USERS_SEARCH',
      payload: {
        q: e.target.value
      }
    });
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

  console.log(userSearchResults);

  return (
    <div styleName="root">
      <Label className="form-field__label" size="sm">Add Member</Label>
      <div>
        <div className="input-group" styleName="member-search">
          <div className="input-group-prepend">
            <Button>
              Add
            </Button>
          </div>
          <Input type="text" onChange={e => userSearch(e)} />
        </div>
        <DropdownMenu isOpen={showSearchDropdown}>
          {
            userSearchResults.map(user => {
              return (
                <DropdownItem
                  onClick={() => selectUser(user)}
                  key={user.username}>
                  {user.username}
                </DropdownItem>
              )
            })
          }
        </DropdownMenu>
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
