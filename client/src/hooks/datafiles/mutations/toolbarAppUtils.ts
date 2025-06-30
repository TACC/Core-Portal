import { fetchUtil } from 'utils/fetchUtil';

export const getAppUtil = async function fetchAppDefinitionUtil(
  appId: string,
  appVersion: string
) {
  const params = { appId, appVersion };
  const result = await fetchUtil({
    url: '/api/workspace/apps',
    params,
  });
  return result.response;
};

function getAvailableHPCAlloc(activeAllocations: any, appExecHostname: string) {
  // Returns the project name of the first available HPC allocation matching the
  // exec system for the app with remaining compute time, or undefined if none found
  for (let activeAlloc of activeAllocations) {
    for (let allocSys of activeAlloc.systems) {
      if (
        allocSys.type === 'HPC' &&
        allocSys.host === appExecHostname
      ) {
        const availCompute =
          allocSys.allocation.computeAllocated -
          allocSys.allocation.computeUsed;
        if (availCompute > 0) {
          return allocSys.allocation.project; // allocation name
        }
      }
    }
  }
}

export function getAllocationForToolbarAction(
  allocationsState: any,
  appObj: any
) {
  if (allocationsState.portal_alloc) {
    return allocationsState.portal_alloc;
  }
  if (
    Array.isArray(allocationsState.active) &&
    allocationsState.active.length > 0 &&
    appObj
  ) {
    return (
      getAvailableHPCAlloc(
        allocationsState.active,
        appObj.execSystems[0].host
      ) || null
    );
  }
  return null;
}
