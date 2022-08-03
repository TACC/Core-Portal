import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'react-query';
import { useDispatch, useSelector } from 'react-redux';
import DropdownSelector from '_common/DropdownSelector';
import { Button } from 'reactstrap';
import styles from '../../../DataFiles/DataFilesProjectMembers/DataFilesProjectMembers.module.scss';
import LoadingSpinner from '_common/LoadingSpinner';
import {fetchUtil} from 'utils/fetchUtil';

// const getProjectRole = async (projectId, username) => {
//   if (!projectId || !username) return {};
//   const url = `/api/projects/${projectId}/system-role/${username}/`;
//   const request = await fetch(url, {
//     headers: { 'X-CSRFToken': Cookies.get('csrftoken') },
//     credentials: 'same-origin',
//   });
//   const data = await request.json();
//   return data;
// };

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

export const useProjectRole = (projectId, userId) => {
  const dispatch = useDispatch();
  const mutation = useMutation(async (role) => {
    await setProjectRole(projectId, userId, role);
    dispatch({
        type: 'GET_TEAMS',
        payload: { projectId },
    });
  });
  return { mutation };
};

const TASProjectRoleSelector = ({ projectId, userId, role }) => {
  const {
    mutation: { mutate: setProjectRole, isLoading: isMutating, error },
  } = useProjectRole(projectId, userId);
  const [selectedRole, setSelectedRole] = useState(role);
  useEffect(() => setSelectedRole(role), [role]);

  if (isMutating)
    return <LoadingSpinner placement="inline" />;
  if (error) return <span>Error</span>;

  return (
    <div style={{ display: 'inline-flex' }}>
      <DropdownSelector
        value={selectedRole}
        onChange={(e) => setSelectedRole(e.target.value)}
      >
        <option value="Standard">Member</option>
        <option value="Delegate">Allocation Manager</option>
      </DropdownSelector>
      {role !== selectedRole && (
        <Button
          style={{ marginLeft: '5px' }}
          className={styles['ownership-button']}
          onClick={() => setProjectRole(selectedRole)}
        >
          Update
        </Button>
      )}
    </div>
  );
};

export default TASProjectRoleSelector;
