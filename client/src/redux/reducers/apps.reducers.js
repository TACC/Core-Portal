import applicationsFixture from '../sagas/fixtures/applications.fixtures';

export const initialState = {
  categoryApps: applicationsFixture, // replacement of categoryDicts
  categoryDict: {},
  appDict: {},
  appIcons: {},
  error: { isError: false },
  loading: false,
  defaultTab: ''
};

export function apps(state = initialState, action) {
  switch (action.type) {
    case 'GET_APPS_SUCCESS': {
      return {
        ...state,
        ...action.payload,
        loading: false
      };
    }
    case 'GET_APPS_START':
      return {
        ...state,
        loading: true,
        error: { isError: false }
      };
    case 'GET_APPS_ERROR':
      return {
        ...state,
        error: {
          ...action.payload,
          message: action.payload.message,
          isError: true
        },
        loading: false
      };
    default:
      return state;
  }
}

export function app(
  state = {
    definition: {},
    error: { isError: false },
    loading: false
  },
  action
) {
  switch (action.type) {
    case 'LOAD_APP':
      return {
        ...state,
        definition: action.payload,
        loading: false
      };
    case 'GET_APP_START':
      return {
        ...state,
        loading: true,
        error: { isError: false },
        definition: {}
      };
    case 'GET_APP_ERROR':
      return {
        ...state,
        error: {
          ...action.payload,
          message: action.payload.message,
          isError: true
        },
        loading: false
      };
    default:
      return state;
  }
}
