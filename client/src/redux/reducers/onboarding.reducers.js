export const initialState = {
  users: null,
  loading: false,
  error: null
};

export function onboardingAdminList(state = initialState, action) {
  switch (action.type) {
    case 'FETCH_ONBOARDING_ADMIN_LIST_PROCESSING':
      return {
        ...state,
        loading: true
      };
    case 'FETCH_ONBOARDING_ADMIN_LIST_SUCCESS':

      return {
        ...state,
        users: action.payload.users,
        loading: false
      };
    case 'FETCH_ONBOARDING_ADMIN_LIST_ERROR':

      return {
        ...state,
        loading: false,
        error: action.payload
      }
    default:
      return state;
  }
}

export const initialState = {
  users: null,
  loading: false,
  error: null
};

export function onboardingAdminList(state = initialState, action) {
  switch (action.type) {
    case 'FETCH_ONBOARDING_ADMIN_LIST_PROCESSING':
      return {
        ...state,
        loading: true
      };
    case 'FETCH_ONBOARDING_ADMIN_LIST_SUCCESS':

      return {
        ...state,
        users: action.payload.users,
        loading: false
      };
    case 'FETCH_ONBOARDING_ADMIN_LIST_ERROR':

      return {
        ...state,
        loading: false,
        error: action.payload
      }
    default:
      return state;
  }
}