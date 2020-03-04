const initialState = {
  active: [],
  inactive: [],
  loading: true,
  teams: {},
  pages: {},
  userDirectory: {},
  loadingUsernames: true,
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
        loadingPage: true,
        pages: { ...state.pages, ...action.payload }
      };
    case 'PAGE_LOADED':
      return { ...state, loadingPage: false };
    default:
      return state;
  }
}

export default allocations;
