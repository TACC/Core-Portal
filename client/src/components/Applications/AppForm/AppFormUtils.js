import * as Yup from 'yup';
import { getSystemName } from 'utils/systems';

export const getQueueMaxMinutes = (app, queueName) => {
  return app.exec_sys.batchLogicalQueues.find((q) => q.name === queueName)
    .maxMinutes;
};

/**
 * Get validator for max minutes of a queue
 *
 * @function
 * @param {Object} queue
 * @returns {Yup.number()} min/max validation of max minutes
 */
export const getMaxMinutesValidation = (queue) => {
  return Yup.number()
    .min(
      queue.minMinutes,
      `Max Minutes must be greater than or equal to ${queue.minMinutes} for the ${queue.name} queue`
    )
    .max(
      queue.maxMinutes,
      `Max Minutes must be less than or equal to ${queue.maxMinutes} for the ${queue.name} queue`
    );
};

// TODOv3  Create ticket for us/Design to decide if we want to continue to present max run time as hh:mm:ss and translate to maxMinutes
/**
 * Create regex pattern for maxRunTime
 * @function
 * @param {String} maxRunTime - maxRunTime given in the format of hh:mm:ss, usually from the target queue's maxRequestedTime
 * Creates a multigrouped regex to accommodate several layers of timestamps.
 */
export const createMaxRunTimeRegex = (maxRunTime) => {
  const replaceAt = (str, i, replace) => {
    return str.slice(0, i) + replace + str.slice(i + 1);
  };

  const timeStr = maxRunTime.replace(/:/g, '');
  let tmp = '[0-0][0-0]:[0-0][0-0]:[0-0][0-0]$'; // procedurally populated max value regex
  const regBase = '[0-4][0-9]:[0-5][0-9]:[0-5][0-9]$'; // default max values
  let upperReg = tmp;
  let regStr = '^'; // procedurally generated regex string to be returned

  let index = 3;

  // iterate through each value in the maxRunTime to generate a regex group
  timeStr.split('').forEach((n, i, arr) => {
    // only need to generate regex for nonzero values
    if (n > 0) {
      if (arr.length - 1 !== i) {
        tmp = replaceAt(tmp, index, n - 1);
        if (regStr !== '^') {
          regStr += '|^';
        }
        regStr += tmp.slice(0, index + 1) + regBase.slice(index + 1);
      }

      tmp = replaceAt(tmp, index, n);
      upperReg = replaceAt(upperReg, index, n);
      if (arr.length - 1 === i || arr[i + 1] === 0) {
        if (regStr !== '^') {
          regStr += '|^';
        }
        regStr += tmp;
      }
    }

    index += i % 2 === 0 ? 5 : 6;
  });
  return `${regStr}|${upperReg}`;
};

/**
 * Get min node count for queue
 */
const getMinNodeCount = (queue, app) => {
  // all queues have a min node count of 1 except for the normal queue on Frontera which has a min node count of 3
  return getSystemName(app.exec_sys.host) === 'Frontera' &&
    queue.name === 'normal'
    ? 3
    : 1;
};

/**
 * Get validator for a node count of a queue
 *
 * @function
 * @param {Object} queue
 * @returns {Yup.number()} min/max validation of node count
 */
export const getNodeCountValidation = (queue, app) => {
  const min = getMinNodeCount(queue, app);
  return Yup.number()
    .min(
      min,
      `Node Count must be greater than or equal to ${min} for the ${queue.name} queue`
    )
    .max(
      queue.maxNodeCount,
      `Node Count must be less than or equal to ${queue.maxNodeCount} for the ${queue.name} queue`
    );
};

/**
 * Get validator for cores on each node
 *
 * @function
 * @param {Object} queue
 * @returns {Yup.number()} min/max validation of maxProcessorsPerNode
 */
export const getCoresPerNodeValidation = (queue) => {
  if (queue.maxCoresPerNode === -1) {
    return Yup.number();
  }
  return Yup.number().min(1).max(queue.maxCoresPerNode);
};

/**
 * Get validator for queues
 *
 * 'normal' queue isn't supported on Frontera for SERIAL (i.e. one node) jobs
 *
 * @function
 * @param {Object} queue
 * @returns {Yup.string()} validation of queue
 */
export const getQueueValidation = (queue, app) => {
  return Yup.string()
    .required('Required')
    .oneOf(app.exec_sys.batchLogicalQueues.map((q) => q.name))
    .test(
      'is-not-serial-job-using-normal-queue',
      'The normal queue does not support serial apps (i.e. Node Count set to 1).',
      (value, context) => {
        return !(
          (
            getSystemName(app.exec_sys.host) === 'Frontera' &&
            queue.name === 'normal' &&
            !app.definition.jobAttributes.isMpi
          ) // TODOv3 parallelism: consider SERIAL/PARALLEL jobs with v3
        );
      }
    );
};

/**
 * Get corrected values for a new queue
 *
 * Check values and if any do not work with the current queue, then fix those
 * values.
 *
 * @function
 * @param {Object} values
 * @returns {Object} updated/fixed values
 */
export const updateValuesForQueue = (app, values) => {
  const updatedValues = { ...values };
  const queue = app.exec_sys.batchLogicalQueues.find(
    (q) => q.name === values.execSystemLogicalQueue
  );
  const minNodeCount = getMinNodeCount(queue, app);
  const maxCoresPerNode = queue.maxCoresPerNode;

  if (values.nodeCount < minNodeCount) {
    updatedValues.nodeCount = minNodeCount;
  }

  if (values.nodeCount > queue.maxNodeCount) {
    updatedValues.nodeCount = queue.maxNodeCount;
  }

  if (
    queue.maxCoresPerNode !== -1 /* e.g. Frontera rtx/rtx-dev queue */ &&
    values.coresPerNode > maxCoresPerNode
  ) {
    updatedValues.coresPerNode = queue.maxCoresPerNode;
  }

  /* if user has entered a time and it's somewhat reasonable (i.e. less than max time
  for all the queues, then we should check if the time works for the new queue and update
  it if it doesn't.
   */
  if (values.maxMinutes) {
    const longestMaxRequestedTime = app.exec_sys.batchLogicalQueues
      .map((queue) => queue.maxMinutes)
      .sort()
      .at(-1);
    if (
      Number.isInteger(values.maxMinutes) &&
      values.maxMinutes <= longestMaxRequestedTime &&
      values.maxMinutes > queue.maxMinutes
    ) {
      updatedValues.maxMinutes = queue.maxMinutes;
    }

    /* // TODOv3  HH:MM:SS form

    const runtimeRegExp = new RegExp(
      createMaxRunTimeRegex(longestMaxRequestedTime)
    );
    if (
      runtimeRegExp.test(values.maxMinutes) &&
      values.maxMinutes > queue.maxMinutes
    ) {
      updatedValues.maxMinutes = queue.maxMinutes;
    }
     */
  }

  return updatedValues;
};
