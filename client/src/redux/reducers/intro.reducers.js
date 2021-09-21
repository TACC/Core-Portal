export const initialIntroMessages = {
  DASHBOARD: true,
  APPLICATIONS: true,
  DATA: true,
  ALLOCATIONS: true,
  HISTORY: true,
  ACCOUNT: true,
  TICKETS: true
};

function introMessages(state = initialIntroMessages, action) {
  switch (action.type) {
    case 'INTRO_FETCH_STARTED':
      return {
        ...state
      };
    case 'INTRO_FETCH_SUCCESS':
      return {
        ...state,
        ...action.payload
      };
    case 'INTRO_FETCH_ERROR':
      return {
        ...state
      };
    case 'INTRO_SAVE_STARTED':
      return {
        ...state
      };
    case 'INTRO_SAVE_SUCCESS':
      return {
        ...state,
        ...action.payload
      };
    case 'INTRO_SAVE_ERROR':
      return {
        ...state,
        ...action.paylod
      };
    default:
      return state;
  }
}

export default introMessages;
