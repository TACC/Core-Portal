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
 * Gets the exec system for the default set in the job attributes.
 * Otherwise, get the first entry.
 */
export const getDefaultExecSystem = (app, execSystems) => {
  // If dynamic exec system is not setup, use from job attributes.
  if (!app.definition.notes.dynamicExecSystems) {
    return getExecSystemFromId(app, app.definition.jobAttributes.execSystemId);
  }

  if (execSystems?.length) {
    const execSystemId = app.definition.jobAttributes.execSystemId;

    // Check if the app's default execSystemId is in provided list
    if (execSystems.includes(execSystemId)) {
      return getExecSystemFromId(app, execSystemId);
    }

    // If not found, return the first execSystem from the provided list
    return getExecSystemFromId(app, execSystems[0]);
  }

  return null;
};
