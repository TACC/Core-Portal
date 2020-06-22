const initialState = {
  list: [],
  submit: { submitting: false },
  loading: false
};

function jobs(state = initialState, action) {
  switch (action.type) {
    case 'JOBS_LIST_INIT':
      return initialState;
    case 'JOBS_LIST_START':
      return {
        ...state,
        loading: true
      };
    case 'JOBS_LIST':
      return {
        ...state,
        list: state.list.concat(action.payload)
      };
    case 'JOBS_LIST_FINISH':
      return {
        ...state,
        loading: false
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

export default jobs;
