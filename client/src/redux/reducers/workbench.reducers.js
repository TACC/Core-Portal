export const initialState = {
  debug: false,
  setupComplete: window.__INITIAL_SETUP_COMPLETE__
};

export default function workbench(state = initialState, action) {
  switch (action.type) {
    case 'WORKBENCH_SUCCESS':
      return {
        ...action.payload
      };
    case 'WORKBENCH_FAILURE':
      return initialState;
    default:
      return state;
  }
}
