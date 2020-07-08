export const initialState = {
  status: null
};

export default function workbench(state = initialState, action) {
  switch (action.type) {
    case 'WORKBENCH_SUCCESS':
      return {
        status: action.payload
      };
    case 'WORKBENCH_FAILURE':
      return initialState;
    default:
      return state;
  }
}
