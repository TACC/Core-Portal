export const initialState = {
  list: [],
  submit: { submitting: false },
  loading: false,
  error: null
};

function jobs(state = initialState, action) {
  switch (action.type) {
    case 'JOBS_LIST_INIT':
      return {
        ...state,
        list: [],
        error: null
      };
    case 'JOBS_LIST_START':
      return {
        ...state,
        error: null,
        loading: true
      };
    case 'JOBS_LIST':
      return {
        ...state,
        list: state.list.concat(action.payload)
      };
    case 'JOBS_LIST_ERROR':
      return {
        ...state,
        error: action.payload
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
    case 'UPDATE_JOB_STATUS': {
      const event = action.payload.extra;
      const job = state.list.find(el => el.id === event.id);
      job.status = event.status;
      return state;
    }
    default:
      return state;
  }
}

export default jobs;
