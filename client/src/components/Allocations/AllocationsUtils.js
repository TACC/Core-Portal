import { formatDate } from 'utils/timeFormat';

/**
 * Generate object containing data relevant for each cell in the sub tables of
 * the allocation table
 * @param {Array} arr - array of allocations for each resource
 * @param {String} header - column of the table
 * @returns {Object} Relevant data
 */
export default function systemAccessor(arr, header) {
  switch (header) {
    case 'Awarded':
      return arr.map(({ allocation, type }) => ({
        awarded:
          type === 'HPC'
            ? Math.round(allocation.computeAllocated)
            : Math.round(allocation.storageAllocated),
        type,
        id: allocation.id
      }));
    case 'Remaining':
      return arr.map(({ allocation, type }) => {
        const remaining =
          type === 'HPC'
            ? Math.round(allocation.computeAllocated - allocation.computeUsed)
            : Math.round(allocation.storageAllocated);
        const ratio =
          type === 'HPC' ? remaining / allocation.computeAllocated || 0 : 1;
        return {
          id: allocation.id,
          remaining,
          ratio,
          type
        };
      });
    case 'Expires':
      return arr.map(({ allocation: { end, id } }) => ({
        id,
        date: formatDate(new Date(end))
      }));
    default:
      return arr.map(({ name, allocation: { id } }) => ({
        name,
        id
      }));
  }
}
