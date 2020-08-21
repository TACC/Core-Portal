import { getJobDisplayInformation, isOutputState } from 'utils/jobsUtil';

export const initialState = {
  list: [],
  submit: { submitting: false },
  loading: false,
  reachedEnd: false,
  error: null
};

function updateJobFromNotification(job, notification) {
  // update status
  const updatedJob = { ...job, status: notification.status };
  if (isOutputState(notification.status)) {
    // add archive data path to job
    updatedJob.outputLocation = `${notification.archiveSystem}/${notification.archivePath}`;
  }
  return updatedJob;
}

export function jobs(state = initialState, action) {
  switch (action.type) {
    case 'JOBS_LIST_INIT':
      return {
        ...state,
        list: [],
        error: null,
        reachedEnd: false
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
        list: state.list.concat(action.payload.list),
        reachedEnd: action.payload.reachedEnd
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
    case 'UPDATE_JOB_FROM_NOTIFICATION': {
      const event = action.payload.extra;
      const list = state.list.map(job =>
        job.id === event.id ? updateJobFromNotification(job, event) : job
      );
      return {
        ...state,
        list
      };
    }
    default:
      return state;
  }
}

const initialJobDetail = {
  jobId: null,
  app: null,
  job: null,
  display: null,
  loading: false,
  loadingError: false,
  loadingErrorMessage: ''
};

export function jobDetail(state = initialJobDetail, action) {
  switch (action.type) {
    case 'JOB_DETAILS_FETCH_STARTED':
      return {
        jobId: action.payload,
        app: null,
        job: null,
        display: null,
        loading: true,
        loadingError: false,
        loadingErrorMessage: ''
      };
    case 'JOB_DETAILS_FETCH_SUCCESS':
      return {
        ...state,
        jobId: action.payload.job.id,
        job: action.payload.job,
        display: getJobDisplayInformation(
          action.payload.job,
          action.payload.app
        ),
        loading: false,
        loadingError: false,
        loadingErrorMessage: ''
      };
    case 'JOB_DETAILS_FETCH_ERROR':
      return {
        ...state,
        loadingError: true,
        loadingErrorMessage: action.payload,
        loading: false
      };
    default:
      return state;
  }
}
