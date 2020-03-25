export default function systemAccessor(arr, header) {
  switch (header) {
    case 'Awarded':
      return arr.map(({ allocation: { computeAllocated, id }, type }) => ({
        awarded: Math.round(computeAllocated),
        type,
        id
      }));
    case 'Remaining':
      return arr.map(
        ({ allocation: { id, computeAllocated, computeUsed }, type }) => {
          const remaining = Math.round(computeAllocated - computeUsed);
          const ratio = remaining / computeAllocated || 0;
          return {
            id,
            remaining,
            ratio,
            type
          };
        }
      );
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
