import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Button, Input } from 'reactstrap';

import styles from './UserSearchbar.module.scss';

const UserSearchbar = ({
  members,
  onAdd,
  onChange,
  addDisabled,
  searchDisabled,
  searchResults,
  placeholder,
}) => {
  const [selectedUser, setSelectedUser] = useState('');
  const [inputUser, setInputUser] = useState('');

  const formatUser = ({ firstName, lastName, email, username }) =>
    `${firstName} ${lastName} (${username} | ${email})`;

  const userSearch = (e) => {
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
    },
    [setInputUser, onAdd]
  );

  return (
    <div className={styles.root}>
      <div className={`input-group ${styles['member-search-group']}`}>
        <div className="input-group-prepend">
          <Button
            className={`${styles['add-button']} ${styles['member-search']}`}
            onClick={() =>
              onAddCallback({ user: selectedUser, access: 'edit' })
            }
            disabled={
              !selectedUser || addDisabled || alreadyMember(selectedUser)
            }
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
          disabled={searchDisabled}
          autoComplete="false"
          value={inputUser}
        />
        <datalist id="user-search-list">
          {
            /* eslint-disable */
            // Need to replace this component with a generalized solution from FP-743
            searchResults
              .filter((user) => !alreadyMember(user))
              .map((user) => (
                <option value={formatUser(user)} key={user.username} />
              ))
            /* eslint-enable */
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
  addDisabled: PropTypes.bool,
  searchDisabled: PropTypes.bool,
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
  addDisabled: false,
  searchDisabled: false,
  placeholder: 'Search by name',
};

export default UserSearchbar;
