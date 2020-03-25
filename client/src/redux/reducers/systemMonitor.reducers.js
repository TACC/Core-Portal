const initialState = {
  list: [],
  loading: false
};
export default function systemMonitor(state = initialState, action) {
  switch (action.type) {
    case 'LOAD_SYSTEM_MONITOR':
      return { ...state, loading: true };
    case 'ADD_SYSTEM_MONITOR':
      return { ...state, list: action.payload, loading: false };
    case 'REFRESH_SYSTEM_MONITOR':
      return initialState;
    default:
      return state;
  }
}
