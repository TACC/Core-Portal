export const initialState = {
  admin: {
    users: [],
    loading: false,
    error: null
  },
  user: {
    username: null,
    firstName: null,
    lastName: null,
    setupComplete: false,
    steps: [],
    loading: false,
    error: null
  }
};

export function updateUserFromEvent(user, event) {
  if (user.username === event.username) {
    let step = user.steps.find(step => step.step === event.step);
    if (step) {
      step.events.push(event);
    }
  }
  return { ...user };
}

export function onboarding(state = initialState, action) {
  switch (action.type) {
    case 'FETCH_ONBOARDING_ADMIN_LIST_PROCESSING':
      return {
        ...state,
        admin: {
          ...state.admin,
          loading: true
        }
      };
    case 'FETCH_ONBOARDING_ADMIN_LIST_SUCCESS':
      return {
        ...state,
        admin: {
          ...state.admin,
          users: action.payload.users,
          loading: false
        }
      };
    case 'FETCH_ONBOARDING_ADMIN_LIST_ERROR':
      return {
        ...state,
        admin: {
          ...state.admin,
          error: action.payload,
          loading: false
        }
      };
    case 'FETCH_ONBOARDING_ADMIN_INDIVIDUAL_USER_PROCESSING':
      return {
        ...state,
        user: {
          ...state.user,
          error: null,
          loading: true
        }
      };
    case 'FETCH_ONBOARDING_ADMIN_INDIVIDUAL_USER_SUCCESS':
      return {
        ...state,
        user: {
          ...action.payload,
          error: null,
          loading: false
        }
      };
    case 'FETCH_ONBOARDING_ADMIN_INDIVIDUAL_USER_ERROR':
      return {
        ...state,
        user: {
          ...state.user,
          error: action.payload,
          loading: false
        }
      };
    case 'ONBOARDING_EVENT':
      return {
        ...state,
        user: updateUserFromEvent(state.user, action.payload.setup_event)
      }
    default:
      return state;
  }
}
