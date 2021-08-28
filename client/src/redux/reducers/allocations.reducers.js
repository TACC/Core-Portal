const initialState = {
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
    term: ''
  },
  removingUserOperation: {
    userName: '',
    error: false,
    loading: false
  }
};
function allocations(state = initialState, action) {
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
      const newState = {
        ...state,
        teams: { ...state.teams, ...action.payload.data },
        loadingUsernames: {
          ...state.loadingUsernames,
          ...action.payload.loading
        }
      };
      console.log(newState);
      return newState;
    case 'SET_SEARCH_TERM':
      return {
        ...state,
        search: {
          ...state.search,
          term: action.payload.term
        }
      };
    case 'ADD_SEARCH_RESULTS':
      console.log('dispatched', action.payload);
      return {
        ...state,
        search: { ...state.search, results: action.payload.data }
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
        removingUserOperation: {
          ...state.removingUserOperation,
          ...action.payload
        }
      };
    }
    case 'ALLOCATION_OPERATION_REMOVE_USER_FROM_PROJECT_STATE': {
      const updatedState = { ...state };
      updatedState.teams[action.payload.projectId] = updatedState.teams[
        action.payload.projectId
      ].filter(i => i.username !== action.payload.userName);
      return updatedState;
    }
    default:
      return state;
  }
}

export default allocations;
