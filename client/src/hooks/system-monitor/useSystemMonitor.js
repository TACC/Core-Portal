import { fetchUtil } from 'utils/fetchUtil';

export const useSystemQueue = async (hostname) => {
  const result = await fetchUtil({
    url: `/api/system-monitor/${hostname}`,
  });

  return result;
};
