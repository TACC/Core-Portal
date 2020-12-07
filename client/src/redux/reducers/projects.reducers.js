export const initialState = {
  listing: {
    projects: [],
    error: null,
    loading: false
  }
};

export default function projects(state = initialState, action) {
  switch (action.type) {
    case 'PROJECTS_GET_LISTING_STARTED':
      return {
        ...state,
        listing: {
          ...state.listing,
          error: null,
          loading: true
        }
      };
    case 'PROJECTS_GET_LISTING_SUCCESS':
      return {
        ...state,
        listing: {
          projects: action.payload,
          error: null,
          loading: false
        }
      };
    case 'PROJECTS_GET_LISTING_ERROR':
      return {
        ...state,
        listing: {
          ...state.listing,
          error: action.payload,
          loading: false
        }
      };
    default:
      return state;
  }
}
