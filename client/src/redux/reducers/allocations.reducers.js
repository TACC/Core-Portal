export const initialState = {
  active: [],
  inactive: [],
  loading: true,
  teams: {},
  loadingUsernames: {},
  hosts: {},
  portal_alloc: '',
  loadingPage: false,
  errors: {},
  search: {
    results: [],
    error: false,
    loading: false
  },
  removingUserOperation: {
    userName: '',
    error: false,
    loading: false
  },
  addUserOperation: {
    userName: '',
    error: false,
    loading: false
  }
};

export function allocations(state = initialState, action) {
  switch (action.type) {
    case 'START_ADD_ALLOCATIONS':
      return {
        ...state,
        errors: { ...state.errors, listing: undefined },
        loading: true
      };
    case 'ADD_ALLOCATIONS':
      return { ...state, ...action.payload, loading: false };
    case 'ADD_ALLOCATIONS_ERROR':
      return {
        ...state,
        errors: { ...state.errors, listing: action.payload },
        loading: false
      };
    case 'POPULATE_TEAMS':
      return {
        ...state,
        teams: { ...state.teams, ...action.payload.teams },
        loadingUsernames: {
          ...state.loadingUsernames,
          ...action.payload.loadingTeams
        }
      };
    case 'POPULATE_TEAMS_ERROR':
      return {
        ...state,
        loadingUsernames: {
          ...state.loadingUsernames,
          ...action.payload.loading
        },
        errors: {
          ...state.errors,
          teams: {
            ...state.errors.teams,
            ...action.payload.errors
          }
        }
      };
    case 'ADD_USERNAMES_TO_TEAM':
      return {
        ...state,
        teams: { ...state.teams, ...action.payload.data },
        loadingUsernames: {
          ...state.loadingUsernames,
          ...action.payload.loading
        }
      };
    case 'MANAGE_USERS_INIT':
      return {
        ...state,
        loadingUsernames: {
          ...state.loadingUsernames,
          ...action.payload.loading
        }
      };
    case 'SEARCH_INIT':
      return {
        ...state,
        search: {
          ...state.search,
          results: [],
          error: false,
          loading: true
        }
      };
    case 'ADD_SEARCH_RESULTS':
      return {
        ...state,
        search: {
          ...state.search,
          results: action.payload.data,
          error: false,
          loading: false
        }
      };
    case 'SEARCH_ERROR':
      return {
        ...state,
        search: {
          ...state.search,
          error: true,
          loading: false
        }
      };
    case 'ALLOCATION_OPERATION_REMOVE_USER_INIT': {
      return {
        ...state,
        removingUserOperation: {
          userName: '',
          error: false,
          loading: false
        }
      };
    }
    case 'ALLOCATION_OPERATION_REMOVE_USER_STATUS': {
      return {
        ...state,
        ...action.payload
      };
    }
    case 'ALLOCATION_OPERATION_ADD_USER_INIT': {
      return {
        ...state,
        addUserOperation: {
          userName: '',
          error: false,
          loading: true
        }
      };
    }
    case 'ALLOCATION_OPERATION_ADD_USER_COMPLETE': {
      return {
        ...state,
        addUserOperation: {
          userName: '',
          error: false,
          loading: false
        }
      };
    }
    case 'ALLOCATION_OPERATION_ADD_USER_ERROR': {
      return {
        ...state,
        ...action.payload
      };
    }
    default:
      return state;
  }
}
