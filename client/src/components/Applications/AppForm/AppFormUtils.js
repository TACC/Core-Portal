import * as Yup from 'yup';
import { getSystemName } from 'utils/systems';

export const getMaxQueueRunTime = (app, queueName) => {
  return app.exec_sys.queues.find((q) => q.name === queueName).maxRequestedTime;
};

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
  return getSystemName(app.exec_sys.login.host) === 'Frontera' &&
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
      queue.maxNodes,
      `Node Count must be less than or equal to ${queue.maxNodes} for the ${queue.name} queue`
    );
};

/**
 * Get min node count for queue
 */
const getMaxProcessorsOnEachNode = (queue) =>
  Math.ceil(queue.maxProcessorsPerNode / queue.maxNodes);

/**
 * Get validator for processors on each node
 *
 * @function
 * @param {Object} queue
 * @returns {Yup.number()} min/max validation of maxProcessorsPerNode
 */
export const getProcessorsOnEachNodeValidation = (queue) => {
  if (queue.maxProcessorsPerNode === -1) {
    return Yup.number();
  }
  return Yup.number().min(1).max(getMaxProcessorsOnEachNode(queue));
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
    .oneOf(app.exec_sys.queues.map((q) => q.name))
    .test(
      'is-not-serial-job-using-normal-queue',
      'The normal queue does not support serial apps (i.e. Node Count set to 1).',
      (value, context) => {
        return !(
          getSystemName(app.exec_sys.login.host) === 'Frontera' &&
          queue.name === 'normal' &&
          app.definition.parallelism === 'SERIAL'
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
  const queue = app.exec_sys.queues.find((q) => q.name === values.batchQueue);
  const minNode = getMinNodeCount(queue, app);
  const maxProcessorsOnEachNode = getMaxProcessorsOnEachNode(queue);

  if (values.nodeCount < minNode) {
    updatedValues.nodeCount = minNode;
  }

  if (values.nodeCount > queue.maxNodes) {
    updatedValues.nodeCount = queue.maxNodes;
  }

  if (
    queue.maxProcessorsPerNode !== -1 /* e.g. Frontera rtx/rtx-dev queue */ &&
    values.processorsOnEachNode > maxProcessorsOnEachNode
  ) {
    updatedValues.processorsOnEachNode = maxProcessorsOnEachNode;
  }

  /* if user has entered a time and it's somewhat reasonable (i.e. less than max time
  for all the queues, then we should check if the time works for the new queue and update
  it if it doesn't.
   */
  if (values.maxRunTime) {
    const longestMaxRequestedTime = app.exec_sys.queues
      .map((queue) => queue.maxRequestedTime)
      .sort()
      .at(-1);
    const runtimeRegExp = new RegExp(
      createMaxRunTimeRegex(longestMaxRequestedTime)
    );
    if (
      runtimeRegExp.test(values.maxRunTime) &&
      values.maxRunTime > queue.maxRequestedTime
    ) {
      updatedValues.maxRunTime = queue.maxRequestedTime;
    }
  }

  return updatedValues;
};
