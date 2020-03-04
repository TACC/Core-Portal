export function spinner(state = false, action) {
  switch (action.type) {
    case 'SHOW_SPINNER':
      return true;
    case 'HIDE_SPINNER':
      return false;
    default:
      return state;
  }
}

export function jobs(
  state = {
    list: [],
    submit: { submitting: false }
  },
  action
) {
  switch (action.type) {
    case 'JOBS_LIST':
      return {
        ...state,
        list: action.payload
      };
    case 'TOGGLE_SUBMITTING':
      return {
        ...state,
        submit: { ...state.submit, submitting: !state.submit.submitting }
      };
    case 'FLUSH_SUBMIT':
      return {
        ...state,
        submit: { submitting: false }
      };
    case 'SUBMIT_JOB_SUCCESS':
      return {
        ...state,
        submit: { ...state.submit, response: action.payload, error: false }
      };
    case 'SUBMIT_JOB_ERROR':
      return {
        ...state,
        submit: { ...state.submit, response: action.payload, error: true }
      };
    default:
      return state;
  }
}
