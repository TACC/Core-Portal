import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { fetchUtil } from 'utils/fetchUtil';

// Fetch a project's metadata tree
export const fetchProjectTree = (projectId: string): Promise<any[]> =>
  fetchUtil({ url: `api/projects/${projectId}/tree/`, params: {} });

export const useProjectTree = (
  projectId: string,
  options: Partial<UseQueryOptions<any[]>> = {}
) =>
  useQuery({
    queryKey: ['projectTree', projectId],
    queryFn: () => fetchProjectTree(projectId),
    enabled: !!projectId,
    ...options,
  });

export default useProjectTree;
