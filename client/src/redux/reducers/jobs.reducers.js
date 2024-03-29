import {
  getJobDisplayInformation,
  // TODOv3: dropV2Jobs
  getJobDisplayInformationV2,
  isTerminalState,
} from 'utils/jobsUtil';

export const initialState = {
  list: [],
  submit: { submitting: false },
  loading: false,
  reachedEnd: false,
  error: null,
};

export function jobs(state = initialState, action) {
  switch (action.type) {
    case 'JOBS_LIST_INIT':
      return {
        ...state,
        list: [],
        error: null,
        reachedEnd: false,
      };
    case 'JOBS_LIST_START':
      return {
        ...state,
        error: null,
        loading: true,
      };
    case 'JOBS_LIST':
      return {
        ...state,
        list: state.list.concat(action.payload.list),
        reachedEnd: action.payload.reachedEnd,
      };
    case 'JOBS_LIST_UPDATE_JOB':
      return {
        ...state,
        list: state.list.map((job) =>
          job.uuid === action.payload.job.uuid ? action.payload.job : job
        ),
      };
    case 'JOBS_LIST_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    case 'JOBS_LIST_FINISH':
      return {
        ...state,
        loading: false,
      };
    case 'TOGGLE_SUBMITTING':
      return {
        ...state,
        submit: { ...state.submit, submitting: !state.submit.submitting },
      };
    case 'FLUSH_SUBMIT':
      return {
        ...state,
        submit: { submitting: false },
      };
    case 'SUBMIT_JOB_SUCCESS':
      return {
        ...state,
        submit: { ...state.submit, response: action.payload, error: false },
      };
    case 'SUBMIT_JOB_ERROR':
      return {
        ...state,
        submit: { ...state.submit, response: action.payload, error: true },
      };
    case 'UPDATE_JOBS_FROM_NOTIFICATIONS': {
      const events = action.payload;
      const list = state.list.map((job) => {
        const event = events.find((e) => e.extra.uuid === job.uuid);
        const val =
          !isTerminalState(job.status) && event
            ? { ...job, ...event.extra }
            : job;
        return val;
      });
      return {
        ...state,
        list,
      };
    }
    default:
      return state;
  }
}

// TODOv3: dropV2Jobs
export const initialStateV2 = {
  list: [],
  submit: { submitting: false },
  loading: false,
  reachedEnd: false,
  error: null,
};

// TODOv3: dropV2Jobs
export function jobsv2(state = initialStateV2, action) {
  switch (action.type) {
    case 'JOBS_V2_LIST_INIT':
      return {
        ...state,
        list: [],
        error: null,
        reachedEnd: false,
      };
    case 'JOBS_V2_LIST_START':
      return {
        ...state,
        error: null,
        loading: true,
      };
    case 'JOBS_V2_LIST':
      return {
        ...state,
        list: state.list.concat(
          action.payload.list.map((job) => {
            job.display = getJobDisplayInformationV2(job);
            return job;
          })
        ),
        reachedEnd: action.payload.reachedEnd,
      };
    case 'JOBS_V2_LIST_UPDATE_JOB':
      return {
        ...state,
        list: state.list,
      };
    case 'JOBS_V2_LIST_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    case 'JOBS_V2_LIST_FINISH':
      return {
        ...state,
        loading: false,
      };
    default:
      return state;
  }
}

const initialJobDetail = {
  status: '',
  message: '',
  metadata: null,
  result: {
    id: '',
    name: '',
    uuid: '',
    appId: '',
    description: '',
    lastMessage: '',
    appVersion: '',
    archiveSystemId: '',
    archiveSystemDir: '',
    created: '',
    lastUpdated: '',
    fileInputs: '',
    parameterSet: '',
    status: '',
  },
};

export function jobDetail(state = initialJobDetail, action) {
  switch (action.type) {
    case 'JOB_DETAILS_FETCH_STARTED':
      return {
        jobUuid: action.payload,
        app: null,
        job: null,
        display: null,
        loading: true,
        loadingError: false,
        loadingErrorMessage: '',
      };
    case 'JOB_DETAILS_FETCH_SUCCESS':
      return {
        ...state,
        jobUuid: action.payload.job.uuid,
        job: action.payload.job,
        display: getJobDisplayInformation(
          action.payload.job,
          action.payload.app
        ),
        loading: false,
        loadingError: false,
        loadingErrorMessage: '',
      };
    case 'JOB_DETAILS_FETCH_ERROR':
      return {
        ...state,
        loadingError: true,
        loadingErrorMessage: action.payload,
        loading: false,
      };
    default:
      return state;
  }
}
