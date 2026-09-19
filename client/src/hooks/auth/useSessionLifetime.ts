import { apiClient } from 'utils/apiClient';
import { useQuery } from '@tanstack/react-query';

async function fetchSessionLifetime() {
  const res = await apiClient.get<{ sessionLifetime: number | null }>(
    '/auth/session-lifetime'
  );
  if (res.data.sessionLifetime) return res.data.sessionLifetime * 1000; // convert to ms
  return null;
}

export function useSessionLifetime() {
  return useQuery({
    queryKey: ['sessionLifetime'],
    queryFn: fetchSessionLifetime,
  });
}
