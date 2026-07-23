import { useQuery } from '@tanstack/react-query';
import { apiClient } from 'utils/apiClient';
import { TTapisFile } from 'utils/types';

async function getFileDetail(
  api: string,
  system: string,
  path: string,
  scheme: string = 'private',
  { signal }: { signal: AbortSignal }
) {
  const res = await apiClient.get<{ data: TTapisFile }>(
    `/api/datafiles/${api}/detail/${scheme}/${system}/${path}`,
    { signal }
  );
  return res.data.data;
}

function useFileDetail(
  api: string,
  system: string,
  scheme: string,
  path: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['datafiles', 'fileListing', 'detail', api, scheme, system, path],
    queryFn: ({ signal }) =>
      getFileDetail(api, system, path, scheme, { signal }),
    enabled: !!path && enabled,
    retry: false,
  });
}

export default useFileDetail;
