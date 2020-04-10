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
  loadingPage: false,
  errors: {}
};
function allocations(state = initialState, action) {
  switch (action.type) {
    case 'START_ADD_ALLOCATIONS':
      return {
        ...state,
        errors: { ...state.errors, allocations: undefined },
        loading: true
      };
    case 'ADD_ALLOCATIONS':
      return { ...state, ...action.payload, loading: false };
    case 'ADD_ALLOCATIONS_ERROR':
      return {
        ...state,
        errors: { ...state.errors, allocations: action.payload },
        loading: false
      };
    case 'POPULATE_TEAMS':
      return {
        ...state,
        teams: { ...state.teams, ...action.payload.teams },
        pages: { ...state.pages, ...action.payload.pages }
      };
    case 'POPULATE_TEAMS_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          teams: {
            ...state.errors.teams,
            ...action.payload
          }
        }
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
    case 'USERNAME_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          usernames: {
            ...state.errors.usernames,
            ...action.payload
          }
        }
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
