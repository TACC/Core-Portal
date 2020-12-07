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

export function* watchProjects() {
  yield takeLatest('PROJECTS_GET_LISTING', getProjectsListing);
  yield takeLatest('PROJECTS_SHOW_SHARED_WORKSPACES', showSharedWorkspaces);
}
