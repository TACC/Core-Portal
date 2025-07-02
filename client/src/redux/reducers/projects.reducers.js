export const initialState = {
  listing: {
    projects: [],
    error: null,
    loading: false,
  },
  operation: {
    name: '',
    loading: false,
    error: null,
    result: null,
  },
  metadata: {
    title: '',
    description: '',
    projectId: '',
    members: [],
    loading: false,
    error: null,
  },
};

const addProjectMember = (members, newMember) => {
  return [...members, newMember];
};

const removeProjectMember = (members, removedMember) => {
  return members.filter(
    (el) => el.user.username !== removedMember.user.username
  );
};

export default function projects(state = initialState, action) {
  switch (action.type) {
    case 'PROJECTS_GET_LISTING_STARTED':
      return {
        ...state,
        listing: {
          ...state.listing,
          projects: [],
          error: null,
          loading: true,
        },
      };
    case 'PROJECTS_GET_LISTING_SUCCESS':
      return {
        ...state,
        listing: {
          projects: action.payload,
          error: null,
          loading: false,
        },
      };
    case 'PROJECTS_GET_LISTING_ERROR':
      return {
        ...state,
        listing: {
          ...state.listing,
          error: action.payload,
          loading: false,
        },
      };
    case 'PROJECTS_CREATE_STARTED':
      return {
        ...state,
        operation: {
          name: 'create',
          loading: true,
          error: null,
          result: null,
        },
      };
    case 'PROJECTS_CREATE_SUCCESS':
      return {
        ...state,
        operation: {
          name: 'create',
          result: action.payload,
          loading: false,
          error: null,
        },
      };
    case 'PROJECTS_CREATE_FAILED':
      return {
        ...state,
        operation: {
          name: 'create',
          loading: false,
          error: action.payload,
          result: null,
        },
      };
    case 'PROJECTS_MEMBER_LIST_ADD':
      return {
        ...state,
        metadata: {
          ...state.metadata,
          members: addProjectMember(state.metadata.members, action.payload),
        },
      };
    case 'PROJECTS_MEMBER_LIST_REMOVE':
      return {
        ...state,
        metadata: {
          ...state.metadata,
          members: removeProjectMember(state.metadata.members, action.payload),
        },
      };
    case 'PROJECTS_GET_METADATA_STARTED':
      return {
        ...state,
        metadata: {
          title: '',
          members: [],
          loading: true,
          error: null,
        },
      };
    case 'PROJECTS_GET_METADATA_SUCCESS':
      return {
        ...state,
        metadata: {
          ...state.metadata,
          ...action.payload,
          loading: false,
          error: null,
        },
      };
    case 'PROJECTS_GET_METADATA_FAILED':
      return {
        ...state,
        metadata: {
          title: '',
          members: [],
          loading: false,
          error: action.payload,
        },
      };
    case 'PROJECTS_SET_MEMBER_STARTED':
      return {
        ...state,
        operation: {
          name: 'member',
          loading: true,
          error: null,
          result: null,
        },
      };
    case 'PROJECTS_SET_MEMBER_SUCCESS':
      return {
        ...state,
        metadata: {
          ...state.metadata,
          members: action.payload.members,
          loading: false,
          error: null,
        },
        operation: {
          name: 'member',
          loading: false,
          error: null,
          result: action.payload,
        },
      };
    case 'PROJECTS_SET_MEMBER_FAILED':
      return {
        ...state,
        operation: {
          name: 'member',
          loading: false,
          error: action.payload,
          result: null,
        },
      };
    case 'PROJECTS_SET_MEMBER_RESET':
      return {
        ...state,
        operation: {
          name: 'member',
          loading: false,
          error: null,
          result: null,
        },
      };
    case 'PROJECTS_SET_TITLE_DESCRIPTION_STARTED':
      return {
        ...state,
        operation: {
          name: 'titleDescription',
          loading: true,
          error: null,
          result: null,
        },
      };
    case 'PROJECTS_SET_TITLE_DESCRIPTION_SUCCESS':
      return {
        ...state,
        metadata: {
          ...action.payload,
          loading: false,
          error: null,
        },
        operation: {
          name: 'titleDescription',
          loading: false,
          error: null,
          result: action.payload,
        },
      };
    case 'PROJECTS_SET_TITLE_DESCRIPTION_FAILED':
      return {
        ...state,
        operation: {
          name: 'titleDescription',
          loading: false,
          error: action.payload,
          result: null,
        },
      };
    case 'PROJECTS_CLEAR_OPERATION':
      return {
        ...state,
        operation: initialState.operation,
      };
    case 'PROJECTS_CLEAR_METADATA':
      return {
        ...state,
        metadata: initialState.metadata,
      };
    case 'PROJECTS_CREATE_PUBLICATION_REQUEST_STARTED':
      return {
        ...state,
        operation: {
          name: 'publicationRequest',
          loading: true,
          error: null,
          result: null,
        },
      };
    case 'PROJECTS_CREATE_PUBLICATION_REQUEST_SUCCESS':
      return {
        ...state,
        operation: {
          name: 'publicationRequest',
          loading: false,
          error: null,
          result: action.payload,
        },
      };
    case 'PROJECTS_CREATE_PUBLICATION_REQUEST_FAILED':
      return {
        ...state,
        operation: {
          name: 'publicationRequest',
          loading: false,
          error: action.payload,
          result: null,
        },
      };
    case 'PROJECTS_GET_PUBLICATION_REQUESTS_STARTED':
      return {
        ...state,
        operation: {
          name: 'getPublicationRequests',
          loading: true,
          error: null,
          result: null,
        },
      };
    case 'PROJECTS_GET_PUBLICATION_REQUESTS_SUCCESS':
      return {
        ...state,
        metadata: {
          ...state.metadata,
          publication_requests: action.payload,
        },
        operation: {
          name: 'getPublicationRequests',
          loading: false,
          error: null,
          result: action.payload,
        },
      };
    case 'PROJECTS_GET_PUBLICATION_REQUESTS_FAILED':
      return {
        ...state,
        operation: {
          name: 'getPublicationRequests',
          loading: false,
          error: action.payload,
          result: null,
        },
      };
    default:
      return state;
  }
}
