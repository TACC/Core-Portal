const initialState = {
  active: [],
  inactive: [],
  loading: true,
  teams: {},
  pages: {},
  userDirectory: {},
  loadingUsernames: true
};
function allocations(state = initialState, action) {
  switch (action.type) {
    case 'ADD_ALLOCATIONS':
      return { ...state, ...action.payload, loading: false };
    case 'POPULATE_TEAMS':
      return {
        ...state,
        teams: { ...state.teams, ...action.payload.teams },
        pages: { ...state.pages, ...action.payload.pages }
      };
    case 'ADD_USERNAMES_TO_TEAM':
      return {
        ...state,
        teams: { ...state.teams, ...action.payload },
        loadingUsernames: false
      };
    case 'ADD_USER_TO_DIRECTORY':
      return {
        ...state,
        userDirectory: { ...state.userDirectory, ...action.payload }
      };
    case 'ADD_PAGE':
      return {
        ...state,
        pages: { ...state.pages, ...action.payload }
      };
    default:
      return state;
  }
}

export default allocations;
