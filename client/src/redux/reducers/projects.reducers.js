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
  },
  project: {
    title: '',
    members: []
  }
};

const addProjectMember = (members, newMember) => {
  return [...members, newMember];
};

const removeProjectMember = (members, removedMember) => {
  const index = members.findIndex(
    el => el.user.username === removedMember.user.username
  );
  if (index) {
    members.splice(index, 1);
  }
  return [...members];
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
      };
    case 'PROJECTS_CREATE_SUCCESS':
      return {
        ...state,
        operation: {
          name: 'create',
          result: action.payload,
          loading: false,
          error: null
        }
      };
    case 'PROJECTS_CREATE_FAILED':
      return {
        ...state,
        operation: {
          name: 'create',
          loading: false,
          error: action.payload,
          result: null
        }
      };
    case 'PROJECTS_MEMBER_LIST_SET':
      return {
        ...state,
        project: {
          ...state.project,
          members: [...action.payload]
        }
      };
    case 'PROJECTS_MEMBER_LIST_ADD':
      return {
        ...state,
        project: {
          ...state.project,
          members: addProjectMember(state.project.members, action.payload)
        }
      };
    case 'PROJECTS_MEMBER_LIST_REMOVE':
      return {
        ...state,
        project: {
          ...state.project,
          members: removeProjectMember(state.project.members, action.payload)
        }
      };
    default:
      return state;
  }
}
