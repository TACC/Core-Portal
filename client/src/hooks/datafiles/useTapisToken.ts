import { useQuery } from '@tanstack/react-query';
import { apiClient } from 'utils/apiClient';

export type TTapisToken = {
  token: string;
  baseUrl: string;
  tapisTrackingId: string;
};

async function getTapisToken() {
  const endpoint = `/api/auth/tapis/`;
  const res = await apiClient.get<TTapisToken>(endpoint);
  return res.data;
}

export const getTapisTokenQuery = () => ({
  queryKey: ['tapis-token'],
  queryFn: () => getTapisToken(),
  staleTime: 1000 * 60 * 60 * 4 - 1000 * 60 * 5, // 3hrs 55 minutes stale time
  refetchInterval: 1000 * 60 * 30, // Refetch every 30 minutes
  refetchIntervalInBackground: true,
});

function useTapisToken() {
  return useQuery<TTapisToken>(getTapisTokenQuery());
}

export default useTapisToken;
