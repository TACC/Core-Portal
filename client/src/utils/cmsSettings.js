import { fetchUtil } from 'utils/fetchUtil';

/**
 * Fetch CMS settings
 * @async
 * @returns {Object.<String, String|Number|null>}
 */
async function get() {
  const res = await fetchUtil({ url: '/cms/api/settings/' });
  const json = res.response;
  return json;
}

export default get;
