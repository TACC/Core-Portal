export const initialState = {
  list: [],
  loading: false,
  error: null,
};
export default function systemMonitor(state = initialState, action) {
  switch (action.type) {
    case 'SYSTEM_MONITOR_LOAD':
      return { ...initialState, loading: true };
    case 'SYSTEM_MONITOR_SUCCESS':
      return { ...state, list: action.payload, loading: false };
    case 'SYSTEM_MONITOR_ERROR':
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
}
