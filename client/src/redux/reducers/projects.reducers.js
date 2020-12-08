export const initialState = {
  listing: {
    projects: [],
    error: null,
    loading: false
  },
  operation: {
    name: '',
    loading: false,
    error: null,
    result: null
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
    case 'PROJECTS_CREATE_STARTED':
      return {
        ...state,
        operation: {
          name: 'create',
          loading: true,
          error: null,
          result: null
        }
      }
    case 'PROJECTS_CREATE_SUCCESS':
      return {
        ...state,
        operation: {
          name: 'create',
          result: action.payload,
          loading: false,
          error: null
        }
      }
    case 'PROJECTS_CREATE_FAILED':
      return {
        ...state,
        operation: {
          name: 'create',
          loading: false,
          error: action.payload,
          result: null
        } 
      }
    default:
      return state;
  }
}
