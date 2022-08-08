import { fetchUtil } from 'utils/fetchUtil';

const getApps = async (operation, params) => {
  const url = `/api/workspace/tapisapps/${operation}`;
  const response = await fetchUtil({
    url,
    params
  });
  return response;
};
const useApps = (operation, params) => {
  const query = useQuery(['apps', operation, params], () =>
    getApps(operation, params)
  );
  return { query };
};

export default useApps;
