import { TTapisSystem, TPortalApp } from 'utils/types';

/**
 * Get the execution system object for a given id of the execution system.
 */
export const getExecSystemFromId = (
  app: TPortalApp,
  execSystemId: string
): TTapisSystem | undefined => {
  if (app.execSystems?.length) {
    return app.execSystems.find((exec_sys) => exec_sys.id === execSystemId);
  }

  return undefined;
};

/**
 * If dynamic exec system feature is not enabled for app, then
 * returns the exec system info for exec system provided in job attribute.
 * For dynamic exec system, uses preferredSystemId and finds in in the
 * provided list, otherwise, uses job attribute exec system. Otherwise, gets
 * the first item in the list.
 *
 * @returns exec system object
 */
export const getDefaultExecSystem = (
  app: TPortalApp,
  execSystems: string[],
  preferredSystemId: string | undefined = undefined
): TTapisSystem | undefined => {
  // If dynamic exec system is not setup, use from job attributes.
  if (!app.definition.notes.dynamicExecSystems) {
    return getExecSystemFromId(app, app.definition.jobAttributes.execSystemId);
  }

  if (execSystems?.length) {
    if (preferredSystemId && execSystems.includes(preferredSystemId)) {
      return getExecSystemFromId(app, preferredSystemId);
    }

    const execSystemId = app.definition.jobAttributes.execSystemId;
    // Check if the app's default execSystemId is in provided list
    if (execSystems.includes(execSystemId)) {
      return getExecSystemFromId(app, execSystemId);
    }

    // If not found, return the first execSystem from the provided list
    return getExecSystemFromId(app, execSystems[0]);
  }

  return undefined;
};
