const initialWelcomeMessages = {
  sections: {
    'dashboard': false,
    'applications': false,
    'datafiles': false,
    'allocations': false,
    'history': false
  }
};

export function welcomeMessages(state = initialWelcomeMessages, action) {
  switch (action.type) {
    case 'WELCOME_FETCH_STARTED':
      return {
        ...state,
      };
    case 'WELCOME_FETCH_SUCCESS':
      return {
        ...state,
        ...action.payload,
      };
    case 'WELCOME_FETCH_ERROR':
      return {
        ...state
      };
    default:
      return state;
  }
}