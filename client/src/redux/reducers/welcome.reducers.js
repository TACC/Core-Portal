export const initialWelcomeMessages = {
  dashboard: true,
  applications: true,
  datafiles: true,
  allocations: true,
  history: true,
  profile: true,
  tickets: true
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
