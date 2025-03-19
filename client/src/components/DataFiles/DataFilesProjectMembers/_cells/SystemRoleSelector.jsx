import React, { useState, useEffect, createContext, useContext } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import Cookies from 'js-cookie';
import fetch from 'cross-fetch';
import DropdownSelector from '_common/DropdownSelector';
import { Button } from '_common';
import styles from '../DataFilesProjectMembers.module.scss';
import LoadingSpinner from '_common/LoadingSpinner';

const getSystemRole = async (projectId, username) => {
  if (!projectId || !username) return {};
  const url = `/api/projects/${projectId}/system-role/${username}/`;
  const request = await fetch(url, {
    headers: { 'X-CSRFToken': Cookies.get('csrftoken') },
    credentials: 'same-origin',
  });
  const data = await request.json();
  return data;
};

const setSystemRole = async (projectId, username, role) => {
  const url = `/api/projects/${projectId}/members/`;
  const request = await fetch(url, {
    headers: { 'X-CSRFToken': Cookies.get('csrftoken') },
    credentials: 'same-origin',
    method: 'PATCH',
    body: JSON.stringify({
      action: 'change_system_role',
      username,
      newRole: role,
    }),
  });
  const data = await request.json();
  return data;
};

export const useSystemRole = (projectId, username) => {
  const query = useQuery({
    queryKey: ['system-role', projectId, username],
    queryFn: () => getSystemRole(projectId, username),

    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const mutation = useMutation({
    mutationFn: async (role) => {
      await setSystemRole(projectId, username, role);
      query.refetch();
    },
  });
  return { query, mutation };
};

const SystemRoleSelector = ({ projectId, username }) => {
  const roleMap = {
    OWNER: 'Owner',
    ADMIN: 'Administrator',
    USER: 'User (read/write)',
    GUEST: 'Guest (read only)',
  };
  const authenticatedUser = useSelector(
    (state) => state.authenticatedUser.user.username
  );

  const readOnlyTeam = useSelector((state) => {
    const projectSystem = state.systems.storage.configuration.find(
      (s) => s.scheme === 'projects'
    );

    return projectSystem?.readOnly;
  });

  const { query: authenticatedUserQuery } = useSystemRole(
    projectId,
    authenticatedUser
  );
  const currentUserRole = authenticatedUserQuery.data?.role;

  const {
    query: { data, isLoading, isFetching, error },
    mutation: { mutate: setSystemRole, isLoading: isMutating },
  } = useSystemRole(projectId, username);
  const [selectedRole, setSelectedRole] = useState(data?.role);
  useEffect(() => setSelectedRole(data?.role), [data?.role]);

  if (isLoading || authenticatedUserQuery.isLoading || isMutating)
    return <LoadingSpinner placement="inline" />;
  if (error) return <span>Error</span>;
  //Only owners/admins can change roles;
  // owner roles cannot be changed except using the Transfer mechanism;
  // users cannot change their own roles.
  if (
    data.role === 'OWNER' ||
    username === authenticatedUser ||
    !['OWNER', 'ADMIN'].includes(currentUserRole) ||
    readOnlyTeam
  )
    return <span>{roleMap[data.role]}</span>;
  return (
    <div style={{ display: 'inline-flex' }}>
      <DropdownSelector
        value={selectedRole}
        onChange={(e) => setSelectedRole(e.target.value)}
        className={styles['project-role-selector']}
      >
        <option value="USER">User (read/write)</option>
        <option value="GUEST">Guest (read only)</option>
      </DropdownSelector>
      {data.role !== selectedRole && !isFetching && (
        <Button
          type="secondary"
          size="small"
          className={styles['ownership-button']}
          onClick={() => setSystemRole(selectedRole)}
        >
          Update
        </Button>
      )}
    </div>
  );
};

export default SystemRoleSelector;
