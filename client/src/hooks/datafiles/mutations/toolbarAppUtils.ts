import { fetchUtil } from 'utils/fetchUtil';
import {
  TTasAllocation,
  TTasAllocatedSystem,
  TPortalApp,
  TUserAllocations,
  TTapisSystem,
} from 'utils/types';

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

export function hasAvailCompute(allocSys: TTasAllocatedSystem) {
  const availCompute =
    allocSys.allocation.computeAllocated - allocSys.allocation.computeUsed;
  if (availCompute > 0) {
    return true;
  }
  return false;
}

function getAvailableHPCAlloc(
  activeAllocations: TTasAllocation[],
  portalAllocName: string,
  appExecHostname: string
) {
  // Returns the project name of the first available HPC allocation matching the
  // exec system for the app with remaining compute time (checking portal allocation
  // first), or undefined if none found
  const portalAlloc = activeAllocations.find(
    (activeAlloc: TTasAllocation) => activeAlloc.projectName === portalAllocName
  );
  if (portalAlloc) {
    // prioritize portal allocation
    let matchingAllocatedExecSys = portalAlloc.systems.find(
      (system: TTasAllocatedSystem) =>
        system.type === 'HPC' && system.host === appExecHostname
    );
    if (matchingAllocatedExecSys && hasAvailCompute(matchingAllocatedExecSys)) {
      return portalAllocName;
    }
  }

  for (let activeAlloc of activeAllocations) {
    let matchingAllocatedExecSys = activeAlloc.systems.find(
      (system: TTasAllocatedSystem) =>
        system.type === 'HPC' && system.host === appExecHostname
    );
    if (matchingAllocatedExecSys && hasAvailCompute(matchingAllocatedExecSys)) {
      return matchingAllocatedExecSys.allocation.project; // allocation name
    }
  }
  return null;
}

export function getAllocationForToolbarAction(
  allocationsState: TUserAllocations,
  appObj: TPortalApp
) {
  const { portal_alloc: portalAllocName, active: activeAllocations } =
    allocationsState;
  if (
    Array.isArray(activeAllocations) &&
    activeAllocations.length > 0 &&
    appObj
  ) {
    const appExecSys = appObj.execSystems.find(
      (execSys: TTapisSystem) =>
        execSys.id === appObj.definition.jobAttributes.execSystemId
    );
    if (appExecSys) {
      if (!appExecSys.canRunBatch) {
        return 'VM'; // if app runs on VM, no allocation needed, so bypass allocation check
      }
      return getAvailableHPCAlloc(
        activeAllocations,
        portalAllocName,
        appExecSys.host
      );
    }
  }
  return null;
}
