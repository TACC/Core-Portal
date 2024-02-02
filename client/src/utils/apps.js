/**
 * Get the execution system object for a given id of the execution system.
 */
export const getExecSystemFromId = (app, execSystemId) => {
  if (app.execSystems?.length) {
    return app.execSystems.find((exec_sys) => exec_sys.id === execSystemId);
  }

  return null;
};

/**
 * Get the execution system object for a given id of the execution system.
 */
export const getDefaultExecSystem = (app) => {
  if (app?.execSystems?.length) {
    return getExecSystemFromId(app, app.execSystemId) ?? app.execSystems[0];
  }

  return null;
};
