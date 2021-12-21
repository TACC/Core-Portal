export const initialState = {
  admin: {
    users: [],
    offset: 0,
    limit: 25,
    total: 0,
    query: null,
    loading: false,
    error: null,
  },
  user: {
    username: null,
    firstName: null,
    lastName: null,
    setupComplete: false,
    steps: [],
    loading: false,
    error: null,
  },
  action: {
    step: null,
    action: null,
    loading: false,
    username: null,
    error: null,
  },
};

export function updateAdminUsersFromEvent(adminUsers, event) {
  const result = [...adminUsers];
  const matchingIndex = adminUsers.findIndex(
    (user) => user.username === event.username
  );
  if (matchingIndex > -1) {
    result[matchingIndex] = updateUserFromEvent(result[matchingIndex], event);
  }
  return result;
}

export function updateUserFromEvent(user, event) {
  const result = { ...user };
  if (result.username === event.username) {
    if (event.step === 'portal.apps.onboarding.execute.execute_setup_steps') {
      result.setupComplete = event.data.setupComplete;
    }
    const foundStep = result.steps.find((step) => step.step === event.step);
    if (foundStep) {
      foundStep.events.unshift(event);
      foundStep.state = event.state;
    }
  }
  return result;
}

export function onboarding(state = initialState, action) {
  switch (action.type) {
    case 'FETCH_ONBOARDING_ADMIN_LIST_PROCESSING':
      return {
        ...state,
        admin: {
          ...state.admin,
          loading: true,
        },
      };
    case 'FETCH_ONBOARDING_ADMIN_LIST_SUCCESS':
      return {
        ...state,
        admin: {
          ...action.payload,
          loading: false,
          error: null,
        },
      };
    case 'FETCH_ONBOARDING_ADMIN_LIST_ERROR':
      return {
        ...state,
        admin: {
          ...state.admin,
          error: action.payload,
          loading: false,
        },
      };
    case 'FETCH_ONBOARDING_ADMIN_INDIVIDUAL_USER_PROCESSING':
      return {
        ...state,
        user: {
          ...state.user,
          error: null,
          loading: true,
        },
      };
    case 'FETCH_ONBOARDING_ADMIN_INDIVIDUAL_USER_SUCCESS':
      return {
        ...state,
        user: {
          ...action.payload,
          error: null,
          loading: false,
        },
      };
    case 'FETCH_ONBOARDING_ADMIN_INDIVIDUAL_USER_ERROR':
      return {
        ...state,
        user: {
          ...state.user,
          error: action.payload,
          loading: false,
        },
      };
    case 'ONBOARDING_EVENT':
      return {
        ...state,
        admin: {
          ...state.admin,
          users: updateAdminUsersFromEvent(
            state.admin.users,
            action.payload.setup_event
          ),
        },
        user: updateUserFromEvent(state.user, action.payload.setup_event),
      };
    case 'POST_ONBOARDING_ACTION_PROCESSING':
      return {
        ...state,
        action: {
          step: action.payload.step,
          action: action.payload.action,
          username: action.payload.username,
          loading: true,
          error: null,
        },
      };
    case 'POST_ONBOARDING_ACTION_SUCCESS':
      return {
        ...state,
        action: {
          ...state.action,
          loading: false,
          error: null,
        },
      };
    case 'POST_ONBOARDING_ACTION_ERROR':
      return {
        ...state,
        action: {
          ...state.action,
          loading: false,
          error: action.payload.error,
        },
      };
    default:
      return state;
  }
}
