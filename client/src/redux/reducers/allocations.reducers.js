function allocations(state = [], action) {
  switch (action.type) {
    case 'ADD_ALLOCATIONS':
      return action.payload;
    case 'REFRESH_ALLOCATIONS':
      return [];
    default:
      return state;
  }
}

export default allocations;
