export const initialState = {
  loading: false,
  config: {},
  setupComplete: window.__INITIAL_SETUP_COMPLETE__
};

export default function workbench(state = initialState, action) {
  switch (action.type) {
    case 'WORKBENCH_INIT':
      return {
        ...initialState,
        loading: true
      };
    case 'WORKBENCH_SUCCESS':
      return {
        ...state,
        ...action.payload,
        loading: false
      };
    case 'WORKBENCH_FAILURE':
      return initialState;
    default:
      return state;
  }
}
