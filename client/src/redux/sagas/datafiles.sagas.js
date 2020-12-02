import fetch from 'cross-fetch';
import { stringify } from 'query-string';
import Cookies from 'js-cookie';
import {
  takeLatest,
  takeLeading,
  put,
  call,
  all,
  race,
  take
} from 'redux-saga/effects';
import { fetchUtil } from 'utils/fetchUtil';

export async function fetchSystemsUtil() {
  const response = await fetch('/api/datafiles/systems/list/');
  if (!response.ok) {
    throw new Error(response.status);
  }
  const responseJson = await response.json();
  return responseJson;
}

export function* fetchSystems() {
  try {
    const systemsJson = yield call(fetchSystemsUtil);
    yield put({ type: 'FETCH_SYSTEMS_SUCCESS', payload: systemsJson });
  } catch (e) {
    yield put({ type: 'FETCH_SYSTEMS_ERROR', payload: e.message });
  }
}

export function* watchFetchSystems() {
  // The result of the systems call shouldn't change so we only care about
  // the first result.
  yield takeLeading('FETCH_SYSTEMS', fetchSystems);
}

export async function pushKeysUtil(system, form) {
  const url = `/api/accounts/systems/${system}/keys/`;
  const request = await fetch(url, {
    method: 'PUT',
    headers: { 'X-CSRFToken': Cookies.get('csrftoken') },
    credentials: 'same-origin',
    body: JSON.stringify({ form, action: 'push' })
  });
  return request;
}

export function* watchPushKeys() {
  yield takeLeading('DATA_FILES_PUSH_KEYS', pushKeys);
}

export function* pushKeys(action) {
  const form = {
    password: action.payload.password,
    token: action.payload.token,
    type: action.payload.type,
    hostname: null
  };

  yield call(pushKeysUtil, action.payload.system, form);

  yield call(action.payload.reloadCallback);
  yield put({
    type: 'DATA_FILES_TOGGLE_MODAL',
    payload: {
      operation: 'pushKeys',
      props: {}
    }
  });
}

export function* watchFetchFiles() {
  yield takeLatest('FETCH_FILES', fetchFiles);
}

export function* watchFetchFilesModal() {
  yield takeLatest('FETCH_FILES_MODAL', fetchFiles);
}

export async function fetchFilesUtil(
  api,
  scheme,
  system,
  path,
  offset = 0,
  limit = 100,
  queryString = ''
) {
  const operation = queryString ? 'search' : 'listing';
  const q = stringify({ limit, offset, query_string: queryString });
  const url = `/api/datafiles/${api}/${operation}/${scheme}/${system}/${path}?${q}`;
  const response = await fetch(url);

  const responseJson = await response.json();
  if (!response.ok) {
    const err = new Error('Error listing files');
    err.status = response.status;
    err.data = responseJson;
    throw err;
  }

  return responseJson.data;
}

export function* fetchFiles(action) {
  yield put({
    type: 'FETCH_FILES_START',
    payload: {
      section: action.payload.section,
      params: {
        api: action.payload.api,
        scheme: action.payload.scheme,
        system: action.payload.system,
        path: action.payload.path || ''
      }
    }
  });

  try {
    const listingResponse = yield call(
      fetchFilesUtil,
      action.payload.api,
      action.payload.scheme,
      action.payload.system,
      action.payload.path || '',
      action.payload.offset,
      action.payload.limit,
      action.payload.queryString
    );
    yield put({
      type: 'FETCH_FILES_SUCCESS',
      payload: {
        files: listingResponse.listing,
        reachedEnd: listingResponse.reachedEnd,
        section: action.payload.section
      }
    });
  } catch (e) {
    yield put({
      type: 'FETCH_FILES_ERROR',
      payload: {
        section: action.payload.section,
        code: e.status.toString()
      }
    });
    // If listing returns 502, body should contain a system def for key pushing.
    yield e.status === 502 &&
      put({
        type: 'SET_SYSTEM',
        payload: {
          system: e.data.system
        }
      });
  }
}

export function* watchScrollFiles() {
  yield takeLeading('SCROLL_FILES', scrollFiles);
}

export function* scrollFiles(action) {
  yield put({
    type: 'SCROLL_FILES_START',
    payload: {
      section: action.payload.section
    }
  });

  const listingResponse = yield call(
    fetchFilesUtil,
    action.payload.api,
    action.payload.scheme,
    action.payload.system,
    action.payload.path || '',
    action.payload.offset,
    action.payload.limit,
    action.payload.queryString
  );
  yield put({
    type: 'SCROLL_FILES_SUCCESS',
    payload: {
      files: listingResponse.listing,
      reachedEnd: listingResponse.reachedEnd,
      section: action.payload.section
    }
  });
}

export async function renameFileUtil(api, scheme, system, path, newName) {
  const url = `/api/datafiles/${api}/rename/${scheme}/${system}${path}/`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'X-CSRFToken': Cookies.get('csrftoken') },
    credentials: 'same-origin',
    body: JSON.stringify({ new_name: newName })
  });
  if (!response.ok) {
    throw new Error(response.status);
  }

  const responseJson = await response.json();
  return responseJson.data;
}

export function* watchRename() {
  yield takeLeading('DATA_FILES_RENAME', renameFile);
}

export function* renameFile(action) {
  const file = action.payload.selectedFile;
  yield put({
    type: 'DATA_FILES_SET_OPERATION_STATUS',
    payload: { status: 'RUNNING', operation: 'rename' }
  });
  try {
    const response = yield call(
      renameFileUtil,
      action.payload.api,
      action.payload.scheme,
      file.system,
      file.path,
      action.payload.newName
    );
    yield put({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { status: 'SUCCESS', operation: 'rename' }
    });
    yield call(action.payload.reloadCallback, response.name, response.path);
  } catch (e) {
    yield put({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { status: 'ERROR', operation: 'rename' }
    });
  }
}

export async function moveFileUtil(
  api,
  scheme,
  system,
  path,
  destSystem,
  destPath
) {
  const url = `/api/datafiles/${api}/move/${scheme}/${system}${path}/`;
  const request = await fetch(url, {
    method: 'PUT',
    headers: { 'X-CSRFToken': Cookies.get('csrftoken') },
    credentials: 'same-origin',
    body: JSON.stringify({ dest_system: destSystem, dest_path: destPath })
  });
  if (!request.ok) {
    throw new Error(request.status);
  }
  return request.data;
}

export function* watchMove() {
  yield takeLeading('DATA_FILES_MOVE', moveFiles);
}

export function* moveFile(src, dest, index) {
  yield put({
    type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
    payload: { status: 'RUNNING', key: index, operation: 'move' }
  });
  try {
    yield call(
      moveFileUtil,
      'tapis',
      'private',
      src.system,
      src.path,
      dest.system,
      dest.path,
      index
    );
    yield put({
      type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
      payload: { status: 'SUCCESS', key: index, operation: 'move' }
    });
  } catch (e) {
    yield put({
      type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
      payload: { status: 'ERROR', key: index, operation: 'move' }
    });
  }
}
export function* moveFiles(action) {
  const { dest } = action.payload;
  const moveCalls = action.payload.src.map(file => {
    return call(moveFile, file, dest, file.id);
  });

  yield race({
    result: all(moveCalls),
    cancel: take('DATA_FILES_MODAL_CLOSE')
  });

  yield call(action.payload.reloadCallback);
}

export async function copyFileUtil(
  api,
  scheme,
  system,
  path,
  destSystem,
  destPath
) {
  const url = `/api/datafiles/${api}/copy/${scheme}/${system}${path}/`;
  const request = await fetch(url, {
    method: 'PUT',
    headers: { 'X-CSRFToken': Cookies.get('csrftoken') },
    credentials: 'same-origin',
    body: JSON.stringify({ dest_system: destSystem, dest_path: destPath })
  });
  if (!request.ok) {
    throw new Error(request.status);
  }
  return request.data;
}

export function* watchCopy() {
  yield takeLeading('DATA_FILES_COPY', copyFiles);
}

export function* copyFile(src, dest, index) {
  yield put({
    type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
    payload: { status: 'RUNNING', key: index, operation: 'copy' }
  });
  try {
    yield call(
      copyFileUtil,
      'tapis',
      'private',
      src.system,
      src.path,
      dest.system,
      dest.path,
      index
    );
    yield put({
      type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
      payload: { status: 'SUCCESS', key: index, operation: 'copy' }
    });
  } catch (e) {
    yield put({
      type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
      payload: { status: 'ERROR', key: index, operation: 'copy' }
    });
  }
}
export function* copyFiles(action) {
  const { dest } = action.payload;
  const copyCalls = action.payload.src.map(file => {
    return call(copyFile, file, dest, file.id);
  });
  yield race({
    result: all(copyCalls),
    cancel: take('DATA_FILES_MODAL_CLOSE')
  });
  yield call(action.payload.reloadCallback);
}

export async function uploadFileUtil(api, scheme, system, path, file) {
  let apiPath = !path || path[0] === '/' ? path : `/${path}`;
  if (apiPath === '/') {
    apiPath = '';
  }
  const formData = new FormData();
  formData.append('uploaded_file', file);
  const url = `/api/datafiles/${api}/upload/${scheme}/${system}${apiPath}/`;

  const request = await fetch(url, {
    method: 'POST',
    headers: { 'X-CSRFToken': Cookies.get('csrftoken') },
    credentials: 'same-origin',
    body: formData
  });
  if (!request.ok) {
    throw new Error(request.status);
  }
  return request;
}

export function* watchUpload() {
  yield takeLeading('DATA_FILES_UPLOAD', uploadFiles);
}

export function* uploadFiles(action) {
  const uploadCalls = action.payload.files.map(file => {
    return call(
      uploadFile,
      'tapis',
      'private',
      action.payload.system,
      action.payload.path,
      file.data,
      file.id
    );
  });

  yield race({
    result: all(uploadCalls),
    cancel: take('DATA_FILES_MODAL_CLOSE')
  });

  yield call(action.payload.reloadCallback);
}

export function* uploadFile(api, scheme, system, path, file, index) {
  yield put({
    type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
    payload: { status: 'UPLOADING', key: index, operation: 'upload' }
  });
  try {
    yield call(uploadFileUtil, api, scheme, system, path, file);
    yield put({
      type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
      payload: { status: 'SUCCESS', key: index, operation: 'upload' }
    });
  } catch (e) {
    yield put({
      type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
      payload: { status: 'ERROR', key: index, operation: 'upload' }
    });
  }
}

export function* watchPreview() {
  yield takeLatest('DATA_FILES_PREVIEW', preview);
}

export function* preview(action) {
  yield put({
    type: 'DATA_FILES_SET_PREVIEW_HREF',
    payload: { href: null }
  });

  const href = yield call(
    previewUtil,
    action.payload.api,
    action.payload.scheme,
    action.payload.system,
    action.payload.path,
    action.payload.href
  );

  yield put({
    type: 'DATA_FILES_SET_PREVIEW_HREF',
    payload: { href }
  });
}

export async function previewUtil(api, scheme, system, path, href) {
  const url = `/api/datafiles/${api}/preview/${scheme}/${system}${path}/`;
  const request = await fetch(url, {
    method: 'PUT',
    headers: { 'X-CSRFToken': Cookies.get('csrftoken') },
    credentials: 'same-origin',
    body: JSON.stringify({ href })
  });

  const requestJson = await request.json();
  return requestJson.data.href;
}

export async function mkdirUtil(api, scheme, system, path, dirname) {
  let apiPath = !path || path[0] === '/' ? path : `/${path}`;
  if (apiPath === '/') {
    apiPath = '';
  }
  const url = `/api/datafiles/${api}/mkdir/${scheme}/${system}${apiPath}/`;
  const request = await fetch(url, {
    method: 'PUT',
    headers: { 'X-CSRFToken': Cookies.get('csrftoken') },
    credentials: 'same-origin',
    body: JSON.stringify({ dir_name: dirname })
  });

  return request;
}

export function* watchMkdir() {
  yield takeLeading('DATA_FILES_MKDIR', mkdir);
}

export function* mkdir(action) {
  yield call(
    mkdirUtil,
    action.payload.api,
    action.payload.scheme,
    action.payload.system,
    action.payload.path,
    action.payload.dirname
  );

  yield call(action.payload.reloadCallback);
  yield put({
    type: 'DATA_FILES_TOGGLE_MODAL',
    payload: {
      operation: 'mkdir',
      props: {}
    }
  });
}

export async function downloadUtil(api, scheme, system, path, href) {
  const url = `/api/datafiles/${api}/download/${scheme}/${system}${path}/`;
  const request = await fetch(url, {
    method: 'PUT',
    headers: { 'X-CSRFToken': Cookies.get('csrftoken') },
    credentials: 'same-origin',
    body: JSON.stringify({ href })
  });

  const requestJson = await request.json();
  const postitUrl = requestJson.data;

  const link = document.createElement('a');
  link.style.display = 'none';
  link.setAttribute('href', postitUrl);
  link.setAttribute('type', '');
  link.setAttribute('target', '_self');
  link.setAttribute('download', 'null');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function* watchDownload() {
  yield takeLeading('DATA_FILES_DOWNLOAD', download);
}

export function* download(action) {
  const { href } = action.payload.file._links.self;
  yield call(
    downloadUtil,
    'tapis',
    'private',
    action.payload.file.system,
    action.payload.file.path,
    href
  );
}

export async function trashUtil(api, scheme, system, path) {
  const url = `/api/datafiles/${api}/trash/${scheme}/${system}${path}/`;
  const request = await fetch(url, {
    method: 'PUT',
    headers: { 'X-CSRFToken': Cookies.get('csrftoken') },
    credentials: 'same-origin',
    body: JSON.stringify({})
  });

  if (!request.ok) {
    throw new Error(request.status);
  }
  return request;
}

export function* watchTrash() {
  yield takeLeading('DATA_FILES_TRASH', trashFiles);
}

export function* trashFiles(action) {
  const trashCalls = action.payload.src.map(file => {
    return call(trashFile, file.system, file.path, file.id);
  });
  yield race({
    result: all(trashCalls),
    cancel: take('DATA_FILES_MODAL_CLOSE')
  });
  yield call(action.payload.reloadCallback);
}

export function* trashFile(system, path, id) {
  yield put({
    type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
    payload: { status: 'RUNNING', key: id, operation: 'trash' }
  });
  try {
    yield call(trashUtil, 'tapis', 'private', system, path);

    yield put({
      type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
      payload: { status: 'SUCCESS', key: id, operation: 'trash' }
    });
  } catch (e) {
    yield put({
      type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
      payload: { status: 'ERROR', key: id, operation: 'trash' }
    });
  }
}

const getExtractParams = async file => {
  const res = await fetchUtil({
    url: '/api/workspace/apps',
    params: { publicOnly: true }
  });
  const apps = res.response;

  const latestExtract = apps
    .filter(app => app.id.includes('extract-frontera'))
    .reduce(
      (latest, app) => {
        if (app.version > latest.version) {
          return app;
        }
        if (app.version < latest.version) {
          return latest;
        }
        // Same version of app
        if (app.revision >= latest.revision) {
          return app;
        }
        return latest;
      },
      { revision: null, version: null }
    );
  const inputFile = `agave://${file.system}${file.path}`;
  const archivePath = `agave://${file.system}${file.path.substring(
    0,
    file.path.lastIndexOf('/') + 1
  )}`;
  return JSON.stringify({
    allocation: 'FORK',
    appId: latestExtract.id,
    archive: true,
    archivePath,
    inputs: {
      inputFile
    },
    maxRunTime: '02:00:00',
    name: 'Extracting Zip File',
    parameters: {}
  });
};

export function* extractFiles(action) {
  try {
    const params = yield call(getExtractParams, action.payload.file);
    yield put({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { status: 'RUNNING', operation: 'extract' }
    });
    const submission = yield call(jobHelper, params);
    if (submission.execSys) {
      // If the execution system requires pushing keys, then
      // bring up the modal and retry the extract action
      yield put({
        type: 'SYSTEMS_TOGGLE_MODAL',
        payload: {
          operation: 'pushKeys',
          props: {
            onSuccess: action,
            system: submission.execSys
          }
        }
      });
    } else if (submission.status === 'ACCEPTED') {
      yield put({
        type: 'DATA_FILES_SET_OPERATION_STATUS',
        payload: { status: 'SUCCESS', operation: 'extract' }
      });
    } else {
      throw new Error('Unable to extract files');
    }
  } catch (error) {
    yield put({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { status: 'ERROR', operation: 'extract' }
    });
  }
}
export function* watchExtract() {
  yield takeLeading('DATA_FILES_EXTRACT', extractFiles);
}

/**
 * Create JSON string of job params
 * @async
 * @param {Array<Object>} files
 * @param {String} zipfileName
 * @returns {String}
 */
const getCompressParams = async (files, zipfileName) => {
  const res = await fetchUtil({
    url: '/api/workspace/apps',
    params: { publicOnly: true }
  });
  const apps = res.response;
  const latestZippy = apps
    .filter(app => app.id.includes('zippy-frontera'))
    .reduce(
      (latest, app) => {
        if (app.version > latest.version) {
          return app;
        }
        if (app.version < latest.version) {
          return latest;
        }
        // Same version of app
        if (app.revision >= latest.revision) {
          return app;
        }
        return latest;
      },
      { revision: null, version: null }
    );
  const inputs = {
    inputFiles: files.map(file => `agave://${file.system}${file.path}`)
  };
  const parameters = {
    filenames: files.reduce((names, file) => `${names}"${file.name}" `, ''),
    zipfileName
  };
  const archivePath = `agave://${files[0].system}${files[0].path.substring(
    0,
    files[0].path.lastIndexOf('/') + 1
  )}`;

  return JSON.stringify({
    allocation: 'FORK',
    appId: latestZippy.id,
    archive: true,
    archivePath,
    maxRunTime: '02:00:00',
    name: 'Compressing Files',
    inputs,
    parameters
  });
};

export function* compressFiles(action) {
  try {
    const params = yield call(
      getCompressParams,
      action.payload.files,
      action.payload.filename
    );
    yield put({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { status: 'RUNNING', operation: 'compress' }
    });
    const submission = yield call(jobHelper, params);
    if (submission.execSys) {
      // If the execution system requires pushing keys, then
      // bring up the modal and retry the compress action
      yield put({
        type: 'SYSTEMS_TOGGLE_MODAL',
        payload: {
          operation: 'pushKeys',
          props: {
            onSuccess: action,
            system: submission.execSys
          }
        }
      });
    } else if (submission.status === 'ACCEPTED') {
      yield put({
        type: 'DATA_FILES_SET_OPERATION_STATUS',
        payload: { status: 'SUCCESS', operation: 'compress' }
      });
    } else {
      throw new Error('Unable to compress files');
    }
  } catch (error) {
    yield put({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { status: 'ERROR', operation: 'compress' }
    });
  }
}
export async function jobHelper(body) {
  const url = '/api/workspace/jobs';
  const res = await fetchUtil({ url, method: 'POST', body });
  return res.response;
}
export function* watchCompress() {
  yield takeLeading('DATA_FILES_COMPRESS', compressFiles);
}
