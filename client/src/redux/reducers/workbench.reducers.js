export const initialState = {
  loading: true,
  config: {},
  portalName: '',
  setupComplete: window.__INITIAL_SETUP_COMPLETE__,
  sitekey: ''
};

export default function workbench(state = initialState, action) {
  switch (action.type) {
    case 'WORKBENCH_INIT':
      return {
        ...state,
        loading: true
      };
    case 'WORKBENCH_SUCCESS':
      return {
        ...state,
        ...action.payload,
        loading: false,
        sitekey: action.payload.sitekey
      };
    case 'WORKBENCH_FAILURE':
      return initialState;
    default:
      return state;
  }
}
