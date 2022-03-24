export const initialIntroMessages = {
  DASHBOARD: true,
  APPLICATIONS: true,
  DATA: true,
  ALLOCATIONS: true,
  HISTORY: true,
  ACCOUNT: true,
  TICKETS: true,
};

export const initialCustomMessages = {
  messages: [],
  templates: [],
};

export function introMessages(state = initialIntroMessages, action) {
  switch (action.type) {
    case 'INTRO_FETCH_STARTED':
      return {
        ...state,
      };
    case 'INTRO_FETCH_SUCCESS':
      return {
        ...state,
        ...action.payload,
      };
    case 'INTRO_FETCH_ERROR':
      return {
        ...state,
      };
    case 'INTRO_SAVE_STARTED':
      return {
        ...state,
      };
    case 'INTRO_SAVE_SUCCESS':
      return {
        ...state,
        ...action.payload,
      };
    case 'INTRO_SAVE_ERROR':
      return {
        ...action.payload,
      };
    default:
      return state;
  }
}

export function customMessages(state = initialCustomMessages, action) {
  switch (action.type) {
    case 'CUSTOM_MESSAGES_FETCH_STARTED':
      return {
        ...state,
      };
    case 'CUSTOM_MESSAGES_FETCH_SUCCESS':
      return {
        ...state,
        ...action.payload,
      };
    case 'CUSTOM_MESSAGES_FETCH_ERROR':
      return {
        ...state,
      };
    case 'CUSTOM_MESSAGES_SAVE_STARTED':
      return {
        ...state,
      };
    case 'CUSTOM_MESSAGES_SAVE_SUCCESS':
      return {
        ...state,
        ...action.payload,
      };
    case 'CUSTOM_MESSAGES_SAVE_ERROR':
      return {
        ...action.payload,
      };
    default:
      return state;
  }
}
