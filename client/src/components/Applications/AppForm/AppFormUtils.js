import * as Yup from 'yup';

export const getMaxQueueRunTime = (app, queueName) => {
  return app.exec_sys.queues.find(q => q.name === queueName).maxRequestedTime;
};

/**
 * Create regex pattern for maxRunTime
 * @function
 * @param {String} maxRunTime - maxRunTime given in the format of hh:mm:ss, usually from the target queue's maxRequestedTime
 * Creates a multigrouped regex to accommodate several layers of timestamps.
 */
export const createMaxRunTimeRegex = maxRunTime => {
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
 * Get validator for a node count of a queue
 *
 * @function
 * @param {Object} queue
 * @returns {Yup.number()} min/max validation of node count
 */
export const getNodeCountValidation = queue => {
  // all queues have a min node count of 1 except for the normal queue.
  const min = queue.name === 'normal' ? 3 : 1;
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
 * Get validator for processors on each node
 *
 * @function
 * @param {Object} queue
 * @returns {Yup.number()} min/max validation of maxProcessorsPerNode
 */
export const getProcessorsOnEachNodeValidation = queue => {
  if (queue.maxNodes === -1) {
    return Yup.number().min(1);
  }
  return Yup.number()
    .min(1)
    .max(queue.maxProcessorsPerNode / queue.maxNodes);
};

export const getQueueValidation = (queue, app) => {
  return Yup.string()
    .required('Required')
    .oneOf(app.exec_sys.queues.map(q => q.name))
    .test(
      'is-not-serial-job-using-normal-queue',
      'The normal queue does not support serial apps (i.e. Node Count set to 1).',
      (value, context) =>
        queue.name !== 'normal' || app.definition.parallelism !== 'SERIAL'
    );
};
