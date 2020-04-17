const initialState = {
  active: [],
  inactive: [],
  loading: true,
  teams: {},
  loadingUsernames: {},
  hosts: {},
  portal_alloc: '',
  loadingPage: false
};
function allocations(state = initialState, action) {
  switch (action.type) {
    case 'START_ADD_ALLOCATIONS':
      return { ...state, loading: true };
    case 'ADD_ALLOCATIONS':
      return { ...state, ...action.payload, loading: false };
    case 'POPULATE_TEAMS':
      return {
        ...state,
        teams: { ...state.teams, ...action.payload.teams },
        loadingUsernames: {
          ...state.loadingUsernames,
          ...action.payload.loadingTeams
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
    default:
      return state;
  }
}

export default allocations;
