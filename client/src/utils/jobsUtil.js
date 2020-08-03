export function getOutputPathFromHref(href) {
  const path = href
    .split('/')
    .slice(7)
    .filter(Boolean)
    .join('/');
  if (path === 'listings') {
    return null;
  }
  return path;
}

export function getAllocationFromAppId(appId) {
  /* Return allocation

   App id has the form: prtl.clone.{username}.{allocation} like
   the following: prtl.clone.nathanf.TACC-ACI.namd-frontera-2.1.3-8.0

   */
  const parts = appId.split('.');
  if (appId.startsWith(`prtl.clone.`) && parts.length >= 6) {
    return parts[3];
  }
  return null;
}

/**
 * Get display values from job and app info
 */
export function getJobDisplayInformation(job, app) {
  const display = {
    applicationName: job.appId,
    systemName: job.systemId,
    inputs: Object.entries(job.inputs)
      .map(([key, val]) => ({
        label: key,
        id: key,
        value: val
      }))
      .filter(obj => !obj.id.startsWith('_')),
    parameters: Object.entries(job.parameters)
      .map(([key, val]) => ({
        label: key,
        id: key,
        value: val
      }))
      .filter(obj => !obj.id.startsWith('_'))
  };

  if (app) {
    // Improve any values with app information
    display.applicationName = app.label;

    // Improve input/parameters
    display.inputs.forEach(input => {
      const matchingParameter = app.inputs.find(obj => {
        return input.id === obj.id;
      });
      if (matchingParameter) {
        // eslint-disable-next-line no-param-reassign
        input.label = matchingParameter.details.label;
      }
    });
    display.parameters.forEach(input => {
      const matchingParameter = app.parameters.find(obj => {
        return input.id === obj.id;
      });
      if (matchingParameter) {
        // eslint-disable-next-line no-param-reassign
        input.label = matchingParameter.details.label;
      }
    });
    // filter non-visible
    display.inputs.filter(input => {
      const matchingParameter = app.inputs.find(obj => {
        return input.id === obj.id;
      });
      if (matchingParameter) {
        return matchingParameter.value.visible;
      }
      return true;
    });
    display.parameters.filter(input => {
      const matchingParameter = app.parameters.find(obj => {
        return input.id === obj.id;
      });
      if (matchingParameter) {
        return matchingParameter.value.visible;
      }
      return true;
    });

    if (app.scheduler === 'SLURM') {
      const allocation = getAllocationFromAppId(job.appId);
      if (allocation) {
        display.allocation = allocation;
      }
      display.queue = job.remoteQueue;
    }
  }
  return display;
}
