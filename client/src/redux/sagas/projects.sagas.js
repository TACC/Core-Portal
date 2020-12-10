import { put, takeLatest, call } from 'redux-saga/effects';
import { fetchUtil } from 'utils/fetchUtil';

export async function fetchProjectsListing() {
  const result = await fetchUtil({
    url: `/api/projects/`
  });
  return result.response;
}

export function* getProjectsListing() {
  yield put({
    type: 'PROJECTS_GET_LISTING_STARTED'
  });
  try {
    const projects = yield call(fetchProjectsListing);

    yield put({
      type: 'PROJECTS_GET_LISTING_SUCCESS',
      payload: projects
    });
  } catch (error) {
    yield put({
      type: 'PROJECTS_GET_LISTING_ERROR',
      payload: error
    });
  }
}

export function* showSharedWorkspaces() {
  // Clear FileListing params to reset breadcrumbs
  yield put({
    type: 'DATA_FILES_CLEAR_PROJECT_SELECTION'
  });
  // Load projects list
  yield put({
    type: 'PROJECTS_GET_LISTING'
  });
}

export async function fetchCreateProject(project) {
  const result = await fetchUtil({
    url: `/api/projects/`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(project)
  });
  return result.response;
}

export function* createProject(action) {
  yield put({
    type: 'PROJECTS_CREATE_STARTED'
  });
  try {
    const project = yield call(fetchCreateProject, action.payload);
    yield put({
      type: 'PROJECTS_CREATE_SUCCESS',
      payload: project
    });
    action.payload.onCreate(project.id);
  } catch (error) {
    yield put({
      type: 'PROJECTS_CREATE_FAILED',
      payload: error
    });
  }
}

export async function fetchMetadata(system) {
  const result = await fetchUtil({
    url: `/api/projects/system/${system}/`
  });
  return result.response;
}

export function* getMetadata(action) {
  yield put({
    type: 'PROJECTS_GET_METADATA_STARTED'
  });
  try {
    const metadata = yield call(fetchMetadata, action.payload);
    yield put({
      type: 'PROJECTS_GET_METADATA_SUCCESS',
      payload: metadata
    });
  } catch (error) {
    yield put({
      type: 'PROJECTS_GET_METADATA_FAILED',
      payload: error
    });
  }
}

export async function setMemberUtil(projectId, data) {
  const result = await fetchUtil({
    url: `/api/projects/${projectId}/members/`,
    method: 'patch',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return result.response;
}

export function* setMember(action) {
  yield put({
    type: 'PROJECTS_SET_MEMBER_STARTED',
  });
  try {
    const { projectId, data } = action.payload;
    const metadata = yield call(setMemberUtil, projectId, data);
    yield put({
      type: 'PROJECTS_SET_MEMBER_SUCCESS',
      payload: metadata
    })
  } catch (error) {
    yield put({
      type: 'PROJECTS_SET_MEMBER_FAILED',
      payload: error
    })
  }
}

export function* watchProjects() {
  yield takeLatest('PROJECTS_GET_LISTING', getProjectsListing);
  yield takeLatest('PROJECTS_SHOW_SHARED_WORKSPACES', showSharedWorkspaces);
  yield takeLatest('PROJECTS_CREATE', createProject);
  yield takeLatest('PROJECTS_GET_METADATA', getMetadata);
  yield takeLatest('PROJECTS_SET_MEMBER', setMember);
}
