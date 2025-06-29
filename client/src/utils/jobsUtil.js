import { getSystemName } from './systems';
import { getExecSystemFromId } from './apps';

const TERMINAL_STATES = [`FINISHED`, `CANCELLED`, `FAILED`];

export function isTerminalState(status) {
  return TERMINAL_STATES.includes(status);
}

// determine if state of job has output
export function isOutputState(status) {
  return isTerminalState(status) && status !== 'CANCELLED';
}

export function getParentPath(file) {
  return `${file.path.slice(0, -file.name.length)}` || '.'; // set parent path to root if no enclosing folder
}

export function getArchivePath(job) {
  return `${job.archiveSystemId}${
    job.archiveSystemDir.charAt(0) === '/' ? '' : '/'
  }${job.archiveSystemDir === '/.' ? '' : job.archiveSystemDir}`;
}

export function getExecutionPath(job) {
  return `${job.execSystemId}${
    job.execSystemExecDir.charAt(0) === '/' ? '' : '/'
  }${job.execSystemExecDir}`;
}

export function getExecSysOutputPath(job) {
  return `${job.execSystemId}${
    job.execSystemOutputDir.charAt(0) === '/' ? '' : '/'
  }${job.execSystemOutputDir}`;
}

export function getOutputPath(job) {
  if (!job.remoteOutcome || !isOutputState(job.status)) {
    return '';
  }

  if (job.remoteOutcome === 'FAILED_SKIP_ARCHIVE') {
    return getExecSysOutputPath(job);
  }

  return getArchivePath(job);
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
  const filterHiddenObjects = (objects) =>
    objects.filter((obj) => {
      const notes = obj.notes ? JSON.parse(obj.notes) : null;
      return !notes || !notes.isHidden;
    });

  const fileInputs = filterHiddenObjects(JSON.parse(job.fileInputs));
  const parameterSet = JSON.parse(job.parameterSet);
  const parameters = filterHiddenObjects(parameterSet.appArgs);

  const envVariables = parameterSet.envVariables;
  const schedulerOptions = parameterSet.schedulerOptions;
  const display = {
    applicationName: job.appId,
    systemName: job.execSystemId,
    inputs: fileInputs.map((input) => ({
      label: input.name || 'Unnamed Input',
      id: input.sourceUrl,
      value: input.sourceUrl,
    })),

    parameters: parameters.map((parameter) => ({
      label: parameter.name,
      id: parameter.name,
      value: parameter.arg,
    })),
  };

  if (app) {
    // Improve any values with app information
    try {
      try {
        const execSys = getExecSystemFromId(app, job.execSystemId);
        display.systemName =
          execSys?.notes?.label ?? getSystemName(execSys?.host);
      } catch (ignore) {
        // ignore if there is problem improving the system name
      }

      display.applicationName =
        app.definition.notes.label || display.applicationName;

      const workPath = envVariables.find(
        (env) => env.key === '_tapisJobWorkingDir'
      );
      display.workPath = workPath ? workPath.value : '';

      if (app.definition.jobType === 'BATCH') {
        const allocationParam = schedulerOptions.find(
          (opt) => opt.name === 'TACC Allocation'
        );
        const allocation = getAllocatonFromDirective(allocationParam.arg);
        if (allocation) {
          display.allocation = allocation;
        }
        display.queue = job.execSystemLogicalQueue;
      }

      if (!app.definition.notes.hideNodeCountAndCoresPerNode) {
        display.coresPerNode = job.coresPerNode;
        display.nodeCount = job.nodeCount;
      }
    } catch (ignore) {
      // ignore if there is problem using the app definition to improve display
    }
  }

  return display;
}

// TODOv3: dropV2Jobs
export function getJobDisplayInformationV2(job) {
  const display = {
    applicationName: job.appId,
    systemName: job.systemId,
    inputs: Object.entries(job.inputs)
      .map(([key, val]) => ({
        label: key,
        id: key,
        value: val,
      }))
      .filter((obj) => !obj.id.startsWith('_')),
    parameters: Object.entries(job.parameters)
      .map(([key, val]) => ({
        label: key,
        id: key,
        value: val,
      }))
      .filter((obj) => !obj.id.startsWith('_')),
  };
  return display;
}
