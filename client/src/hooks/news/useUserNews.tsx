import { useQuery } from '@tanstack/react-query';
import { apiClient } from 'utils/apiClient';
import { UserNewsResponse } from '.';

interface UseUserNewsOptions {
  sanitize?: boolean;
}

export async function fetchUserNewsUtil({
  sanitize = false,
}: UseUserNewsOptions = {}): Promise<UserNewsResponse[]> {
  const response = await apiClient.get('/api/news/', {
    params: {
      sanitize,
    },
  });
  return response.data?.response ?? [];
}

function useUserNews({ sanitize = false }: UseUserNewsOptions = {}) {
  const { data, isPending, isError, status } = useQuery({
    queryKey: ['userNews', sanitize],
    queryFn: () => fetchUserNewsUtil({ sanitize }),
  });

  return {
    data: data ?? [],
    isPending,
    isError,
    status,
  };
}

export default useUserNews;
