import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '../apiClient';
import { isAxiosError } from 'axios';

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

async function getAuthenticatedUser({ signal }: { signal: AbortSignal }) {
  try {
    const result = await apiClient.get<TAuthenticatedUser>('/api/users/auth/', {
      signal,
    });

    return result.data;
  } catch (err) {
    if (isAxiosError(err) && [401, 403].includes(err.status ?? 500)) {
      return null;
    }
    throw err;
  }
}

export function getAuthenticatedUserQuery() {
  return queryOptions({
    queryKey: ['users', 'authenticatedUser'],
    queryFn: ({ signal }) => getAuthenticatedUser({ signal }),
  });
}
