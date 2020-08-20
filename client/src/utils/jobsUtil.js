const TERMINAL_STATES = [`FINISHED`, `STOPPED`, `FAILED`];

export function isTerminalState(status) {
  return TERMINAL_STATES.includes(status);
}

export function getOutputPathFromHref(href) {
  // get output path from href (i.e. _links.archiveData.href )
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

export function createArchiveDataHref(href, system, path) {
  /* update the archive data path (i.e.  _links.archiveData.href )

 from: https://something.com/jobs/v2/jobuid/outputs/listings
 to:   https://something.com/files/v2/listings/system/archive_system/archive_path */
  const updateHref = href
    .split('/')
    .slice(0, 3)
    .join('/')
    .concat(`/files/v2/listings/system/`)
    .concat(`${system}/${path}`);
  return updateHref;
}
export function getAllocatonFromDirective(directive) {
  /* Return allocation

   queue directive has form: '-A TACC-ACI'

   */
  const parts = directive.split(' ');
  const allocationArgIndex = parts.findIndex(obj => obj === '-A') + 1;
  if (allocationArgIndex !== 0 && allocationArgIndex < parts.length) {
    return parts[allocationArgIndex];
  }
  return null;
}

export function getSystemName(host) {
  const systemName = host.split('.')[0];
  return systemName.substring(0, 1).toUpperCase() + systemName.slice(1);
}

/**
 * Get display values from job, app and execution system info
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
    try {
      try {
        display.systemName = getSystemName(app.exec_sys.login.host);
      } catch (ignore) {
        // ignore if there is problem improving the system name
      }

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
        const matchingQueue = app.exec_sys.queues.find(
          queue => queue.name === job.remoteQueue
        );
        const allocation = getAllocatonFromDirective(
          matchingQueue.customDirectives
        );
        if (allocation) {
          display.allocation = allocation;
        }
        display.queue = job.remoteQueue;
      }

      if (app.parallelism === 'PARALLEL') {
        display.processorsPerNode = job.processorsPerNode;
        display.nodeCount = job.nodeCount;
      }
    } catch (ignore) {
      // ignore if there is problem using the app definition to improve display
    }
  }
  return display;
}
