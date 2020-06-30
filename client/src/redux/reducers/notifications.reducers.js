const initialState = {
  list: [],
  loading: false,
  loadingError: false,
  loadingErrorMessage: ''
};

export default function notifications(state = initialState, action) {
  switch (action.type) {
    case 'NOTIFICATIONS_LIST_FETCH_SUCCESS':
      return {
        ...state,
        list: action.payload,
        loading: false,
        loadingError: false,
        loadingErrorMessage: ''
      };
    case 'NOTIFICATIONS_LIST_FETCH_START':
      return {
        ...state,
        loading: true,
        loadingError: false,
        loadingErrorMessage: ''
      };
    case 'NOTIFICATIONS_LIST_FETCH_ERROR':
      return {
        ...state,
        loadingError: true,
        loadingErrorMessage: action.payload,
        loading: false
      };
    default:
      return state;
  }
}
