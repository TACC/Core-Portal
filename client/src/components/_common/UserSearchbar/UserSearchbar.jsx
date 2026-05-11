import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Input } from 'reactstrap';
import { Button } from '_common';

import styles from './UserSearchbar.module.scss';

const UserSearchbar = ({
  members,
  onAdd,
  onChange,
  isLoading,
  searchResults,
  placeholder,
}) => {
  const [selectedUser, setSelectedUser] = useState('');
  const [inputUser, setInputUser] = useState('');

  const formatUser = ({ firstName, lastName, email, username }) =>
    `${firstName} ${lastName} (${username} | ${email})`;

  const userSearch = (e) => {
    if (e.target.value !== selectedUser) setSelectedUser('');
    setInputUser(e.target.value);
    if (!e.target.value || e.target.value.trim().length < 1) return;
    // Try to set the selectedUser to something matching current search results
    setSelectedUser(
      searchResults.find((user) => formatUser(user) === e.target.value)
    );
    if (!selectedUser) {
      onChangeCallback(e.target.value);
    }
  };

  const alreadyMember = (user) => {
    return members.some(
      (existingMember) =>
        existingMember && existingMember.username === user.username
    );
  };

  const onChangeCallback = useCallback(
    (query) => {
      onChange(query);
    },
    [onChange]
  );

  const onAddCallback = useCallback(
    (user) => {
      onAdd(user);
      setInputUser('');
      setSelectedUser('');
    },
    [setInputUser, onAdd]
  );

  return (
    <div className={styles.root}>
      <div className={`input-group ${styles['member-search-group']}`}>
        <div className="input-group-prepend">
          <Button
            type="secondary"
            onClick={() =>
              onAddCallback({ user: selectedUser, access: 'edit' })
            }
            size="short"
            isLoading={isLoading}
            disabled={!selectedUser || isLoading || alreadyMember(selectedUser)}
          >
            Add
          </Button>
        </div>
        <Input
          list="user-search-list"
          type="text"
          onChange={(e) => userSearch(e)}
          placeholder={placeholder}
          className={styles.memberSearch}
          disabled={isLoading}
          autoComplete="false"
          value={inputUser}
        />
        <datalist id="user-search-list">
          {
            // Need to replace this component with a generalized solution from FP-743
            searchResults
              .filter((user) => !alreadyMember(user))
              .map((user) => (
                <option value={formatUser(user)} key={user.username} />
              ))
          }
        </datalist>
      </div>
    </div>
  );
};

UserSearchbar.propTypes = {
  members: PropTypes.arrayOf(
    PropTypes.shape({
      username: PropTypes.string,
      lastName: PropTypes.string,
      firstName: PropTypes.string,
      email: PropTypes.string,
    })
  ).isRequired,
  onAdd: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  searchResults: PropTypes.arrayOf(
    PropTypes.shape({
      username: PropTypes.string,
      lastName: PropTypes.string,
      firstName: PropTypes.string,
      email: PropTypes.string,
    })
  ).isRequired,
  placeholder: PropTypes.string,
};
UserSearchbar.defaultProps = {
  isLoading: false,
  placeholder: 'Search by name',
};

export default UserSearchbar;
