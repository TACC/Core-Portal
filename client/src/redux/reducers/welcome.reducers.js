export const initialWelcomeMessages = {
  DASHBOARD: true,
  APPLICATIONS: true,
  DATA: true,
  ALLOCATIONS: true,
  HISTORY: true,
  ACCOUNT: true,
  TICKETS: true
};

function welcomeMessages(state = initialWelcomeMessages, action) {
  switch (action.type) {
    case 'WELCOME_FETCH_STARTED':
      return {
        ...state
      };
    case 'WELCOME_FETCH_SUCCESS':
      return {
        ...state,
        ...action.payload
      };
    case 'WELCOME_FETCH_ERROR':
      return {
        ...state
      };
    case 'WELCOME_SAVE_STARTED':
      return {
        ...state
      };
    case 'WELCOME_SAVE_SUCCESS':
      return {
        ...state,
        ...action.payload
      };
    case 'WECOME_SAVE_ERROR':
      return {
        ...state,
        ...action.paylod
      };
    default:
      return state;
  }
}

export default welcomeMessages;
