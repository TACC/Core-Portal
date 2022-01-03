export const initialState = {
  search: {
    users: [],
    loading: false,
    error: null,
  },
};

export function users(state = initialState, action) {
  switch (action.type) {
    case 'USERS_SEARCH_SUCCESS':
      return {
        ...state,
        search: {
          users: action.payload,
          loading: false,
          error: null,
        },
      };
    case 'USERS_SEARCH_FAILED':
      return {
        ...state,
        search: {
          ...state.search,
          loading: false,
          error: action.payload,
        },
      };
    case 'USERS_SEARCH_STARTED':
      return {
        ...state,
        search: {
          ...state.search,
          loading: true,
          error: null,
        },
      };
    case 'USERS_CLEAR_SEARCH':
      return {
        ...state,
        ...initialState,
      };
    default:
      return state;
  }
}
