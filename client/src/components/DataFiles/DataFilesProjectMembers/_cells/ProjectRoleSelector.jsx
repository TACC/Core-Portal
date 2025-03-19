import React, { useState, useEffect, useContext, createContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Cookies from 'js-cookie';
import fetch from 'cross-fetch';
import DropdownSelector from '_common/DropdownSelector';
import { Button } from '_common';
import LoadingSpinner from '_common/LoadingSpinner';

const getProjectRole = async (projectId, username) => {
  const url = `/api/projects/${projectId}/project-role/${username}/`;
  const request = await fetch(url, {
    headers: { 'X-CSRFToken': Cookies.get('csrftoken') },
    credentials: 'same-origin',
  });
  const data = await request.json();
  return data;
};

const setProjectRole = async (projectId, username, oldRole, newRole) => {
  const url = `/api/projects/${projectId}/members/`;
  const request = await fetch(url, {
    headers: { 'X-CSRFToken': Cookies.get('csrftoken') },
    credentials: 'same-origin',
    method: 'PATCH',
    body: JSON.stringify({
      action: 'change_project_role',
      username,
      oldRole,
      newRole,
    }),
  });
  const data = await request.json();
  return data;
};

const useProjectRole = (projectId, username) => {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['project-role', projectId, username],
    queryFn: () => getProjectRole(projectId, username),
  });
  const mutation = useMutation({
    mutationFn: async ({ oldRole, newRole }) => {
      await setProjectRole(projectId, username, oldRole, newRole);
      query.refetch();
      // Invalidate the system role query to keep it up to date.
      queryClient.invalidateQueries(['system-role', projectId, username]);
    },
  });
  return { query, mutation };
};

const ProjectRoleSelector = ({ projectId, username }) => {
  const {
    query: { data, isLoading, error, isFetching },
    mutation: { mutate: setProjectRole, isLoading: isMutating },
  } = useProjectRole(projectId, username);

  const [selectedRole, setSelectedRole] = useState(data?.role);
  useEffect(() => setSelectedRole(data?.role), [data?.role]);

  if (isLoading) return <LoadingSpinner placement="inline" />;
  if (error) return <span>Error</span>;
  if (data?.role == 'pi') return <span>PI</span>;
  return (
    <div style={{ display: 'inline-flex' }}>
      <DropdownSelector
        data-testid="role-dropdown"
        value={selectedRole}
        onChange={(e) => setSelectedRole(e.target.value)}
      >
        <option value="co_pi">Co-PI</option>
        <option value="team_member">Member</option>
      </DropdownSelector>
      {data.role !== selectedRole && !isFetching && (
        <Button
          type="primary"
          onClick={() =>
            setProjectRole({ oldRole: data.role, newRole: selectedRole })
          }
          isLoading={isMutating}
        >
          Update
        </Button>
      )}
    </div>
  );
};

export default ProjectRoleSelector;
