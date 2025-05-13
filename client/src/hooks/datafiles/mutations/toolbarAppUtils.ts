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

function getAvailableHPCAlloc(activeAllocations: any, appExecSysId: string) {
  // Returns the project name of the first available HPC allocation matching the
  // exec system for the app with remaining compute time, or undefined if none found
  for (let activeAlloc of activeAllocations) {
    for (let allocSys of activeAlloc.systems) {
      if (
        allocSys.type === 'HPC' &&
        allocSys.name.toLowerCase() === appExecSysId
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

export function getDefaultAllocation(allocationsState: any, appObj: any) {
  if (allocationsState.portal_alloc) {
    return allocationsState.portal_alloc;
  }
  if (
    Array.isArray(allocationsState.active) &&
    allocationsState.active.length > 0
  ) {
    return (
      getAvailableHPCAlloc(
        allocationsState.active,
        appObj.definition.jobAttributes.execSystemId
      ) || null
    );
  }
  return null;
}
