export const initialRequestAccessState = {
  creating: false,
  creatingError: false,
  creatingErrorMessage: '',
  creatingSuccess: false,
  createdTicketId: null
};

export default function requestAccess(
  state = initialRequestAccessState,
  action
) {
  switch (action.type) {
    case 'REQUEST_ACCESS_INIT':
      return initialRequestAccessState;
    case 'REQUEST_ACCESS_STARTED':
      return {
        ...state,

        creating: true
      };
    case 'REQUEST_ACCESS_FAILED':
      return {
        ...state,

        creating: false,
        creatingError: true,
        creatingErrorMessage: action.payload
      };
    case 'REQUEST_ACCESS_SUCCESS':
      return {
        ...state,

        creating: false,
        creatingSuccess: true,
        createdTicketId: action.payload
      };
    default:
      return state;
  }
}
