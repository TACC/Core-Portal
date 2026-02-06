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

export function getReservationFromArg(arg) {
  /**
   * Extracts the reservation value from a string like '--reservation=foobar'
   */
  const reservationPrefix = '--reservation=';

  if (typeof arg === 'string' && arg.trim().startsWith(reservationPrefix)) {
    return arg.slice(reservationPrefix.length);
  }

  return null;
}

/**
 * Strips trailing suffixes like `_1.2` which Tapis adds to file names.
 */
function _getCleanInputLabel(inputName) {
  const original = inputName || '';
  const stripped = original.replace(/_\d+\.\d+$/, '').trim();
  return stripped || 'Unnamed Input';
}

/**
 * Returns a grouping key for a Tapis input name.
 *
 * If the name ends with `_<field>.<index>` (e.g. "Target path_1.1", "_1.2"),
 * returns `<field>` (e.g. "1") so all files for the same input field group together:
 *     "Target path_1.1" → "1"  (field 1, file 1)
 *     "_1.2"            → "1"  (field 1, file 2)
 *     "_2.1"            → "2"  (field 2, file 1)
 *
 * Otherwise (no Tapis suffix), falls back to the original name so single-file
 * inputs still have a stable grouping key:
 *     "Other target path" → "Other target path"
 */
function _getInputGroupKey(inputName) {
  const match = (inputName || '').match(/_(\d+)\.\d+$/);
  return match ? match[1] : inputName || 'unkown';
}

/**
 * Build display-friendly input labels from job file inputs.
 * Groups inputs by their Tapis field index (the X in `_X.Y`),
 * derives the label from the first entry in each group, and
 * appends "(1/N)", "(2/N)" when a group has multiple files.
 *
 * @param {Array} fileInputs - Filtered (non-hidden) file inputs from job
 * @returns {Array<{label: string, id: string, value: string}>}
 */
export function getInputDisplayValues(fileInputs) {
  if (!fileInputs.length) return [];

  const groups = new Map();
  fileInputs.forEach((input) => {
    const key = _getInputGroupKey(input.name);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(input);
  });

  return [...groups.values()].flatMap((inputs) => {
    // First entry in each group carries the meaningful name;
    // subsequent entries are just suffixes like "_1.2"
    const baseLabel = _getCleanInputLabel(inputs[0].name);

    if (inputs.length === 1) {
      return [
        {
          label: baseLabel,
          id: inputs[0].sourceUrl,
          value: inputs[0].sourceUrl,
        },
      ];
    }

    return inputs.map((input, index) => ({
      label: `${baseLabel} (${index + 1}/${inputs.length})`,
      id: input.sourceUrl,
      value: input.sourceUrl,
    }));
  });
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
    inputs: getInputDisplayValues(fileInputs),
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
          (opt) => opt.name === 'Project Allocation Account'
        );
        const allocation = getAllocatonFromDirective(allocationParam.arg);
        if (allocation) {
          display.allocation = allocation;
        }
        display.queue = job.execSystemLogicalQueue;
      }

      if (app.definition.notes?.showReservation) {
        const reservationParam = schedulerOptions.find(
          (opt) => opt?.name === 'TACC Reservation'
        );
        const reservation = getReservationFromArg(reservationParam?.arg);
        if (reservation) {
          display.reservation = reservation;
        }
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
