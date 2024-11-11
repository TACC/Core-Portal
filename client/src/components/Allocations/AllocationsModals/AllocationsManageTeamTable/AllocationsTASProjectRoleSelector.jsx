import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import DropdownSelector from '_common/DropdownSelector';
import { fetchUtil } from 'utils/fetchUtil';
import { Button } from '_common';
import styles from './AllocationsManageTeamTable.module.scss';

const setProjectRole = async (projectId, userId, role) => {
  const roleMap = {
    Standard: 0,
    Delegate: 2,
  };
  const url = `/api/users/tas-users/`;
  const response = await fetchUtil({
    url,
    method: 'PUT',
    body: JSON.stringify({
      userId,
      role: roleMap[role],
      projectId,
    }),
  });
  return response;
};

const useProjectRole = (projectId, userId) => {
  const dispatch = useDispatch();
  const mutation = useMutation({
    mutationFn: async (role) => {
      await setProjectRole(projectId, userId, role);
      dispatch({
        type: 'GET_PROJECT_USERS',
        payload: { projectId },
      });
    },
  });
  return { mutation };
};

const TASProjectRoleSelector = ({ projectId, userId, role }) => {
  const {
    mutation: { mutate: setProjectRole, isLoading: isMutating, error },
  } = useProjectRole(projectId, userId);
  const [selectedRole, setSelectedRole] = useState(role);
  useEffect(() => setSelectedRole(role), [role]);

  if (error) return <span>Error</span>;

  return (
    <div style={{ display: 'inline-flex' }}>
      <DropdownSelector
        value={selectedRole}
        onChange={(e) => setSelectedRole(e.target.value)}
        disabled={isMutating}
        className={styles['selector']}
      >
        <option value="Standard">Member</option>
        <option value="Delegate">Allocation Manager</option>
      </DropdownSelector>
      {role !== selectedRole && (
        <Button
          type="secondary"
          onClick={() => setProjectRole(selectedRole)}
          size="small"
          isLoading={isMutating}
          className={styles['action-button']}
        >
          Update
        </Button>
      )}
    </div>
  );
};

export default TASProjectRoleSelector;
