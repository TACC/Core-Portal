import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '../apiClient';

export type TAuthenticatedUser = {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  oauth: {
    expires_in: number;
  };
  isStaff: boolean;
  groups: string[];
};

async function getAuthenticatedUser() {
  const result = await apiClient.get<TAuthenticatedUser>('/api/workbench/');
  return result.data;
}

export function getAuthenticatedUserQuery() {
  return queryOptions({
    queryKey: ['workbench'],
    queryFn: getAuthenticatedUser,
  });
}
