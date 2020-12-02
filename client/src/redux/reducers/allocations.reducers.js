const initialState = {
  active: [],
  inactive: [],
  loading: true,
  teams: {},
  loadingUsernames: {},
  hosts: {},
  portal_alloc: '',
  loadingPage: false,
  errors: {}
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
    default:
      return state;
  }
}

export default allocations;
