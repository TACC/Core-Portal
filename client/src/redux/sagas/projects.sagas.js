import { put, takeLatest, call } from 'redux-saga/effects';
import queryStringParser from 'query-string';
import { fetchUtil } from 'utils/fetchUtil';

export async function fetchProjectsListing(queryString, rootSystem) {
  const q = queryStringParser.stringify({ query_string: queryString });
  const url = rootSystem ? `api/projects/${rootSystem}` : `/api/projects/`;
  const result = await fetchUtil({
    url: queryString ? `${url}?${q}` : `${url}`,
  });
  return result.response;
}

export function* getProjectsListing(action) {
  if (!action.payload?.modal) {
    yield put({
      type: 'DATA_FILES_CLEAR_FILE_SELECTION',
    });
  }
  yield put({
    type: 'PROJECTS_GET_LISTING_STARTED',
  });
  try {
    const projects = yield call(
      fetchProjectsListing,
      action.payload.queryString,
      action.payload.rootSystem
    );

    yield put({
      type: 'PROJECTS_GET_LISTING_SUCCESS',
      payload: projects,
    });
  } catch (error) {
    yield put({
      type: 'PROJECTS_GET_LISTING_ERROR',
      payload: error,
    });
  }
}

export function* showSharedWorkspaces(action) {
  // Clear FileListing params to reset breadcrumbs
  yield put({
    type: 'DATA_FILES_CLEAR_PROJECT_SELECTION',
    payload: {
      system: action.payload.rootSystem,
    },
  });

  yield put({
    type: 'PROJECTS_CLEAR_METADATA',
  });

  // Load projects list
  yield put({
    type: 'PROJECTS_GET_LISTING',
    payload: {
      queryString: action.payload.queryString,
      rootSystem: action.payload.rootSystem,
    },
  });
}

export async function fetchCreateProject(project) {
  const result = await fetchUtil({
    url: `/api/projects/`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(project),
  });
  return result.response;
}

export function* createProject(action) {
  yield put({
    type: 'PROJECTS_CREATE_STARTED',
  });
  try {
    const project = yield call(fetchCreateProject, action.payload);
    yield put({
      type: 'PROJECTS_CREATE_SUCCESS',
      payload: project,
    });
    action.payload.onCreate(project.id);
  } catch (error) {
    yield put({
      type: 'PROJECTS_CREATE_FAILED',
      payload: error,
    });
  }
}

export async function fetchMetadata(system) {
  const result = await fetchUtil({
    url: `/api/projects/system/${system}/`,
  });
  return result.response;
}

export function* getMetadata(action) {
  yield put({
    type: 'PROJECTS_CLEAR_METADATA',
  });
  yield put({
    type: 'PROJECTS_GET_METADATA_STARTED',
  });
  try {
    const metadata = yield call(fetchMetadata, action.payload);
    yield put({
      type: 'PROJECTS_GET_METADATA_SUCCESS',
      payload: metadata,
    });
  } catch (error) {
    yield put({
      type: 'PROJECTS_GET_METADATA_FAILED',
      payload: error,
    });
  }
}

export async function setMemberUtil(projectId, data) {
  const result = await fetchUtil({
    url: `/api/projects/${projectId}/members/`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
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
      payload: metadata,
    });
    if (data.action === 'transfer_ownership')
      yield put({
        type: 'ADD_TOAST',
        payload: {
          message: `Project ownership transferred to ${data.newOwner}.`,
        },
      });
    yield put({
      type: 'PROJECTS_GET_LISTING',
      payload: {
        queryString: null,
      },
    });
  } catch (error) {
    yield put({
      type: 'PROJECTS_SET_MEMBER_FAILED',
      payload: error,
    });
  }
}

export async function setTitleDescriptionUtil(projectId, data) {
  const result = await fetchUtil({
    url: `/api/projects/${projectId}/`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return result.response;
}

export function* setTitleDescription(action) {
  yield put({
    type: 'PROJECTS_SET_TITLE_DESCRIPTION_STARTED',
  });
  try {
    const { projectId, data, modal } = action.payload;
    const metadata = yield call(setTitleDescriptionUtil, projectId, data);
    yield put({
      type: 'PROJECTS_SET_TITLE_DESCRIPTION_SUCCESS',
      payload: metadata,
    });
    yield put({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: modal, props: {} },
    });
    yield put({
      type: 'PROJECTS_GET_LISTING',
      payload: {
        queryString: null,
      },
    });
  } catch (error) {
    yield put({
      type: 'PROJECTS_SET_TITLE_DESCRIPTION_FAILED',
      payload: error,
    });
  }
}

export async function createPublicationRequestUtil(data) {
  const result = await fetchUtil({
    url: `/api/publications/publication-request/`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return result.response;
}

export function* createPublicationRequest(action) {
  yield put({
    type: 'PROJECTS_CREATE_PUBLICATION_REQUEST_STARTED',
  });
  try {
    const result = yield call(createPublicationRequestUtil, action.payload);
    yield put({
      type: 'PROJECTS_CREATE_PUBLICATION_REQUEST_SUCCESS',
      payload: result,
    });
  } catch (error) {
    yield put({
      type: 'PROJECTS_CREATE_PUBLICATION_REQUEST_FAILED',
      payload: error,
    });
  }
}

export async function fetchPublicationRequestsUtil(system) {
  const result = await fetchUtil({
    url: `/api/publications/publication-request/${system}`,
  });
  return result.response;
}

export function* getPublicationRequests(action) {
  yield put({
    type: 'PROJECTS_GET_PUBLICATION_REQUESTS_STARTED',
  });
  try {
    const publicationRequests = yield call(
      fetchPublicationRequestsUtil,
      action.payload
    );
    yield put({
      type: 'PROJECTS_GET_PUBLICATION_REQUESTS_SUCCESS',
      payload: publicationRequests,
    });
  } catch (error) {
    yield put({
      type: 'PROJECTS_GET_PUBLICATION_REQUESTS_FAILED',
      payload: error,
    });
  }
}

export async function createEntityUtil(entityType, projectId, path, data) {
  const result = await fetchUtil({
    url: `/api/projects/${projectId}/entities/create`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: entityType,
      value: data,
      path: path,
    }),
  });

  return result.response;
}

export async function patchEntityUtil(
  entityType,
  projectId,
  path,
  updatedPath,
  data,
  entityUuid
) {
  const result = await fetchUtil({
    url: `/api/projects/${projectId}/entities/create`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: entityType,
      value: data,
      uuid: entityUuid ?? null,
      path: path,
      updatedPath: updatedPath,
    }),
  });

  return result.response;
}

export function* watchProjects() {
  yield takeLatest('PROJECTS_GET_LISTING', getProjectsListing);
  yield takeLatest('PROJECTS_SHOW_SHARED_WORKSPACES', showSharedWorkspaces);
  yield takeLatest('PROJECTS_CREATE', createProject);
  yield takeLatest('PROJECTS_GET_METADATA', getMetadata);
  yield takeLatest('PROJECTS_SET_MEMBER', setMember);
  yield takeLatest('PROJECTS_SET_TITLE_DESCRIPTION', setTitleDescription);
  yield takeLatest(
    'PROJECTS_CREATE_PUBLICATION_REQUEST',
    createPublicationRequest
  );
  yield takeLatest('PROJECTS_GET_PUBLICATION_REQUESTS', getPublicationRequests);
}
