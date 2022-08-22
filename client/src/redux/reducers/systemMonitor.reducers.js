export const initialState = {
  list: [],
  hideSystemMonitor: false,
  loading: false,
  error: null,
};
export default function systemMonitor(state = initialState, action) {
  switch (action.type) {
    case "SYSTEM_MONITOR_LOAD":
      return { ...initialState, loading: true, hideSystemMonitor: false };
    case "SYSTEM_MONITOR_SUCCESS":
      return {
        ...state,
        list: action.payload,
        loading: false,
        hideSystemMonitor: !action.payload.length,
      };
    case "SYSTEM_MONITOR_ERROR":
      return {
        ...state,
        error: action.payload,
        loading: false,
        hideSystemMonitor: false,
      };
    default:
      return state;
  }
}
