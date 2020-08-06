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
        const ratio = remaining / allocation.computeAllocated || 0;
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
        date: new Date(end).toDateString()
      }));
    default:
      return arr.map(({ name, allocation: { id } }) => ({
        name,
        id
      }));
  }
}
