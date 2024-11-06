export const initialState = {
  listing: {
    publications: [],
    error: null,
    loading: false,
  },
  operation: {
    name: '',
    loading: false,
    error: null,
    result: null,
  },
};

export default function publications(state = initialState, action) {
  switch (action.type) {
    case 'PUBLICATIONS_GET_PUBLICATIONS_STARTED':
      return {
        ...state,
        listing: {
          ...state.listing,
          publications: [],
          error: null,
          loading: true,
        },
      };
    case 'PUBLICATIONS_GET_PUBLICATIONS_SUCCESS':
      return {
        ...state,
        listing: {
          publications: action.payload,
          error: null,
          loading: false,
        },
      };
    case 'PUBLICATIONS_GET_PUBLICATIONS_FAILED':
      return {
        ...state,
        listing: {
          ...state.listing,
          error: action.payload,
          loading: false,
        },
      };
    case 'PUBLICATIONS_APPROVE_PUBLICATION_STARTED':
      return {
        ...state,
        operation: {
          name: 'approve',
          loading: true,
          error: null,
          result: null,
        },
      };
    case 'PUBLICATIONS_APPROVE_PUBLICATION_SUCCESS':
      return {
        ...state,
        operation: {
          name: 'approve',
          loading: false,
          error: null,
          result: action.payload,
        },
      };
    case 'PUBLICATIONS_APPROVE_PUBLICATION_FAILED':
      return {
        ...state,
        operation: {
          name: 'approve',
          loading: false,
          error: action.payload,
          result: null,
        },
      };
    case 'PUBLICATIONS_REJECT_PUBLICATION_STARTED':
      return {
        ...state,
        operation: {
          name: 'reject',
          loading: true,
          error: null,
          result: null,
        },
      };
    case 'PUBLICATIONS_REJECT_PUBLICATION_SUCCESS':
      return {
        ...state,
        operation: {
          name: 'reject',
          loading: false,
          error: null,
          result: action.payload,
        },
      };
    case 'PUBLICATIONS_REJECT_PUBLICATION_FAILED':
      return {
        ...state,
        operation: {
          name: 'reject',
          loading: false,
          error: action.payload,
          result: null,
        },
      };
    case 'PUBLICATIONS_APPROVE_VERSION_STARTED':
      return {
        ...state,
        operation: {
          name: 'approve',
          loading: true,
          error: null,
          result: null,
        },
      };
    case 'PUBLICATIONS_APPROVE_VERSION_SUCCESS':
      return {
        ...state,
        operation: {
          name: 'approve',
          loading: false,
          error: null,
          result: action.payload,
        },
      };
    case 'PUBLICATIONS_APPROVE_VERSION_FAILED':
      return {
        ...state,
        operation: {
          name: 'approve',
          loading: false,
          error: action.payload,
          result: null,
        },
      };
    case 'PUBLICATIONS_OPERATION_RESET':
      return {
        ...state,
        operation: initialState.operation,
      };
    default:
      return state;
  }
}
