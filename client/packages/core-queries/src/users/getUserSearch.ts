import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '../apiClient';

export type TUserSearchResult = {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
};

async function getUserSearch({
  query,
  signal,
}: {
  query: string;
  signal: AbortSignal;
}) {
  const result = await apiClient.get<TUserSearchResult[]>('/api/users/', {
    params: { q: query },
    signal,
  });

  return result.data;
}

export function getUserSearchQuery({ query }: { query: string }) {
  return queryOptions({
    queryKey: ['users', 'search', query],
    enabled: !!query,
    staleTime: 0,
    queryFn: ({ signal }) => getUserSearch({ query, signal }),
  });
}
