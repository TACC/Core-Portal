import { getSystemName } from './systems';

const TERMINAL_STATES = [`FINISHED`, `STOPPED`, `FAILED`];

export function isTerminalState(status) {
  return TERMINAL_STATES.includes(status);
}

// determine if state of job has output
export function isOutputState(status) {
  return isTerminalState(status) && status !== 'STOPPED';
}

export function getOutputPathFromHref(href) {
  // get output path from href (i.e. _links.archiveData.href )
  const path = href.split('/').slice(7).filter(Boolean).join('/');
  if (path === 'listings') {
    return null;
  }
  return path;
}

export function getAllocatonFromDirective(directive) {
  /* Return allocation

   queue directive has form: '-A TACC-ACI'

   */
  const parts = directive.split(' ');
  const allocationArgIndex = parts.findIndex((obj) => obj === '-A') + 1;
  if (allocationArgIndex !== 0 && allocationArgIndex < parts.length) {
    return parts[allocationArgIndex];
  }
  return null;
}

/**
 * Get display values from job, app and execution system info
 */
export function getJobDisplayInformation(job, app) {
  const fileInputs = JSON.parse(job.fileInputs);
  const parameterSet = JSON.parse(job.parameterSet);
  const parameters = parameterSet.appArgs;
  const envVariables = parameterSet.envVariables;
  const schedulerOptions = parameterSet.schedulerOptions;
  const display = {
    applicationName: job.appId,
    systemName: job.execSystemId,
    inputs: fileInputs
      .map((input) => ({
        label: input.name,
        id: input.name,
        value: input.sourceUrl,
      }))
      .filter((obj) => !obj.id.startsWith('_')),

    parameters: parameters
      .map((parameter) => ({
        label: parameter.name,
        id: parameter.name,
        value: parameter.arg,
      }))
      .filter((obj) => !obj.id.startsWith('_')),
  };

  if (app) {
    // Improve any values with app information
    try {
      try {
        display.systemName = getSystemName(app.exec_sys.host);
      } catch (ignore) {
        // ignore if there is problem improving the system name
      }

      display.applicationName = app.definition.notes.label;

      // TODO: Unsure if needed for v3

      // Improve input/parameters
      // display.inputs.forEach((input) => {
      //   const matchingParameter = app.definition.jobAttributes.fileInputs.find((obj) => {
      //     return input.id === obj.name;
      //   });
      //   if (matchingParameter) {
      //     // eslint-disable-next-line no-param-reassign
      //     input.label = matchingParameter.details.label;
      //   }
      // });
      // display.parameters.forEach((input) => {
      //   const matchingParameter = app.definition.parameters.find((obj) => {
      //     return input.id === obj.id;
      //   });
      //   if (matchingParameter) {
      //     // eslint-disable-next-line no-param-reassign
      //     input.label = matchingParameter.details.label;
      //   }
      // });

      // TODO: Maybe should filter with includes? some have null/array values

      // filter non-visible
      // display.inputs.filter((input) => {
      //   const matchingParameter = app.definition.inputs.find((obj) => {
      //     return input.id === obj.id;
      //   });
      //   if (matchingParameter) {
      //     return matchingParameter.value.visible;
      //   }
      //   return true;
      // });
      // display.parameters.filter((input) => {
      //   const matchingParameter = app.definition.parameters.find((obj) => {
      //     return input.id === obj.id;
      //   });
      //   if (matchingParameter) {
      //     return matchingParameter.value.visible;
      //   }
      //   return true;
      // });

      const workPath = envVariables.find(
        (env) => env.key === '_tapisJobWorkingDir'
      );
      display.workPath = workPath ? workPath.value : '';

      if (app.exec_sys.batchScheduler === 'SLURM') {
        const allocationParam = schedulerOptions.find(
          (opt) => opt.name === 'TACC Allocation'
        );
        const allocation = getAllocatonFromDirective(allocationParam.arg);
        if (allocation) {
          display.allocation = allocation;
        }
        display.queue = job.execSystemLogicalQueue;
      }

      // TODO: Unsure if parallelism exists in v3
      // if (app.definition.parallelism === 'PARALLEL') {
      //   display.processorsPerNode = job.processorsPerNode;
      //   display.nodeCount = job.nodeCount;
      // }

      // if (app.definition.parallelism === 'PARALLEL') {
      // display.processorsPerNode = job.processorsPerNode;
      display.processorsPerNode = job.coresPerNode;
      display.nodeCount = job.nodeCount;
      // }
    } catch (ignore) {
      // ignore if there is problem using the app definition to improve display
    }
  }
  return display;
}
