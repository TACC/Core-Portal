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
  take,
  select
} from 'redux-saga/effects';
import { fetchUtil } from 'utils/fetchUtil';
import truncateMiddle from '../../utils/truncateMiddle';

/**
 * Utility function to replace instances of 2 or more slashes in a URL with
 * a single slash.
 * @param {string} url
 */
export const removeDuplicateSlashes = url => {
  return url.replace(/\/{2,}/g, '/');
};

export async function fetchSystemsUtil() {
  const response = await fetch('/api/datafiles/systems/list/');
  if (!response.ok) {
    throw new Error(response.status);
  }
  const responseJson = await response.json();
  return responseJson;
}

export function* fetchSystems() {
  yield put({ type: 'FETCH_SYSTEMS_STARTED' });
  try {
    const systemsJson = yield call(fetchSystemsUtil);
    yield put({ type: 'FETCH_SYSTEMS_SUCCESS', payload: systemsJson });
  } catch (e) {
    yield put({ type: 'FETCH_SYSTEMS_ERROR', payload: e.message });
  }
}

export async function fetchSystemDefinitionUtil(systemId) {
  const response = await fetch(
    `/api/datafiles/systems/definition/${systemId}/`
  );
  if (!response.ok) {
    throw new Error(response.status);
  }
  const responseJson = await response.json();
  return responseJson;
}

export function* fetchSystemDefinition(action) {
  yield put({ type: 'FETCH_SYSTEM_DEFINITION_STARTED' });
  try {
    const systemJson = yield call(fetchSystemDefinitionUtil, action.payload);
    yield put({
      type: 'FETCH_SYSTEM_DEFINITION_SUCCESS',
      payload: systemJson
    });
  } catch (e) {
    yield put({ type: 'FETCH_SYSTEM_DEFINITION_ERROR', payload: e.message });
  }
}

export function* watchFetchSystems() {
  // The result of the systems call shouldn't change so we only care about
  // the first result.
  yield takeLeading('FETCH_SYSTEMS', fetchSystems);
  yield takeLeading('FETCH_SYSTEM_DEFINITION', fetchSystemDefinition);
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
  queryString = '',
  filter = undefined,
  nextPageToken = null
) {
  const operation = queryString || filter ? 'search' : 'listing';
  const q = stringify({
    limit,
    offset,
    query_string: queryString,
    filter,
    nextPageToken
  });
  const url = removeDuplicateSlashes(
    `/api/datafiles/${api}/${operation}/${scheme}/${system}/${path}?${q}`
  );
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
      action.payload.queryString,
      action.payload.filter
    );
    yield put({
      type: 'FETCH_FILES_SUCCESS',
      payload: {
        files: listingResponse.listing,
        reachedEnd: listingResponse.reachedEnd,
        nextPageToken: listingResponse.nextPageToken,
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

  try {
    const listingResponse = yield call(
      fetchFilesUtil,
      action.payload.api,
      action.payload.scheme,
      action.payload.system,
      action.payload.path || '',
      action.payload.offset,
      action.payload.limit,
      action.payload.queryString,
      action.payload.filter,
      action.payload.nextPageToken
    );
    yield put({
      type: 'SCROLL_FILES_SUCCESS',
      payload: {
        files: listingResponse.listing,
        reachedEnd: listingResponse.reachedEnd,
        nextPageToken: listingResponse.nextPageToken,
        section: action.payload.section
      }
    });
  } catch (e) {
    yield put({
      type: 'SCROLL_FILES_ERR',
      payload: {
        section: action.payload.section
      }
    });
  }
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
    yield put({
      type: 'ADD_TOAST',
      payload: {
        message: `${file.name} renamed to ${truncateMiddle(
          action.payload.newName,
          20
        )}`
      }
    });
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
    return 'ERR';
  }
  return 'SUCCESS';
}
export function* moveFiles(action) {
  const { dest } = action.payload;
  const moveCalls = action.payload.src.map(file => {
    return call(moveFile, file, dest, file.id);
  });
  const { result } = yield race({
    result: all(moveCalls),
    cancel: take('DATA_FILES_MODAL_CLOSE')
  });
  if (!result.includes('ERR')) {
    yield put({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'move', props: {} }
    });
    yield put({
      type: 'ADD_TOAST',
      payload: {
        message: `${
          result.length > 1 ? `${result.length} files` : 'File'
        } moved to ${truncateMiddle(action.payload.dest.path, 20) || '/'}`
      }
    });
  }
  yield call(action.payload.reloadCallback);
}

export async function copyFileUtil(
  api,
  scheme,
  system,
  path,
  filename,
  filetype,
  destApi,
  destSystem,
  destPath,
  destPathName
) {
  let url, body;
  if (api === destApi) {
    url = removeDuplicateSlashes(
      `/api/datafiles/${api}/copy/${scheme}/${system}/${path}/`
    );
    body = {
      dest_system: destSystem,
      dest_path: destPath,
      file_name: filename,
      filetype,
      dest_path_name: destPathName
    };
  } else {
    url = removeDuplicateSlashes(`/api/datafiles/transfer/${filetype}/`);
    body = {
      src_api: api,
      dest_api: destApi,
      src_system: system,
      dest_system: destSystem,
      src_path: path,
      dest_path: destPath,
      dest_path_name: destPathName,
      dirname: filename
    };
  }

  const request = await fetch(url, {
    method: 'PUT',
    headers: { 'X-CSRFToken': Cookies.get('csrftoken') },
    credentials: 'same-origin',
    body: JSON.stringify(body)
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
  const filetype = src.type === 'dir' ? 'dir' : 'file';
  yield put({
    type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
    payload: { status: 'RUNNING', key: index, operation: 'copy' }
  });
  try {
    yield call(
      copyFileUtil,
      src.api,
      'private',
      src.system,
      src.path,
      src.name,
      filetype,
      dest.api,
      dest.system,
      dest.path,
      dest.name,
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
    return 'ERR';
  }
  return 'SUCCESS';
}
export function* copyFiles(action) {
  const { dest } = action.payload;
  const copyCalls = action.payload.src.map(file => {
    return call(copyFile, file, dest, file.id);
  });
  const { result } = yield race({
    result: all(copyCalls),
    cancel: take('DATA_FILES_MODAL_CLOSE')
  });
  if (!result.includes('ERR')) {
    yield put({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'copy', props: {} }
    });
    yield put({
      type: 'ADD_TOAST',
      payload: {
        message: `${
          result.length > 1 ? `${result.length} files` : 'File'
        } copied to ${truncateMiddle(action.payload.dest.name, 20) || '/'}`
      }
    });
  }
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

  const { result } = yield race({
    result: all(uploadCalls),
    cancel: take('DATA_FILES_MODAL_CLOSE')
  });

  if (!result.includes('ERR'))
    yield put({
      type: 'ADD_TOAST',
      payload: {
        message: `${
          result.length > 1 ? `${result.length} files` : 'File'
        } uploaded to ${truncateMiddle(action.payload.path, 20) || '/'}`
      }
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
    return 'ERR';
  }
  return 'SUCCESS';
}

export function* watchPreview() {
  yield takeLatest('DATA_FILES_PREVIEW', preview);
}

export function* preview(action) {
  yield put({
    type: 'DATA_FILES_SET_PREVIEW_CONTENT',
    payload: { href: null, content: null, error: null, isLoading: true }
  });
  try {
    if (action.payload.api !== 'tapis')
      throw new Error('Previewable files must use TAPIS');
    const response = yield call(
      previewUtil,
      action.payload.api,
      action.payload.scheme,
      action.payload.system,
      action.payload.path,
      action.payload.href,
      action.payload.length
    );
    yield put({
      type: 'DATA_FILES_SET_PREVIEW_CONTENT',
      payload: { ...response, isLoading: false }
    });
  } catch (e) {
    yield put({
      type: 'DATA_FILES_SET_PREVIEW_CONTENT',
      payload: {
        content: null,
        href: null,
        error: 'Unable to show preview.',
        isLoading: false
      }
    });
  }
}

export async function previewUtil(api, scheme, system, path, href, length) {
  const q = stringify({ href, length });
  const url = `/api/datafiles/${api}/preview/${scheme}/${system}${path}/?${q}`;
  const request = await fetch(url);
  const requestJson = await request.json();
  return requestJson.data;
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

export async function fileLinkUtil(method, scheme, system, path) {
  const url = `/api/datafiles/link/${scheme}/${system}${path}/`;
  return fetchUtil({
    url,
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

export function* watchLink() {
  yield takeLeading('DATA_FILES_LINK', fileLink);
}

export function* fileLink(action) {
  const { system, path } = action.payload.file;
  const { scheme, method } = action.payload;
  yield put({
    type: 'DATA_FILES_SET_OPERATION_STATUS',
    payload: {
      status: {
        method,
        url: '',
        error: null,
        loading: true
      },
      operation: 'link'
    }
  });
  try {
    const result = yield call(fileLinkUtil, method, scheme, system, path);
    if (method === 'delete') {
      yield put({
        type: 'DATA_FILES_SET_OPERATION_STATUS',
        payload: {
          status: {
            method: null,
            url: '',
            error: null,
            loading: false
          },
          operation: 'link'
        }
      });
      return;
    }
    yield put({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: {
        status: {
          method: null,
          url: result.data || '',
          error: null,
          loading: false
        },
        operation: 'link'
      }
    });
  } catch (error) {
    yield put({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: {
        status: {
          method: null,
          url: '',
          error: error.toString(),
          loading: false
        },
        operation: 'link'
      }
    });
  }
}

export async function downloadUtil(api, scheme, system, path, href, length) {
  const q = stringify({ href, length });
  const url = `/api/datafiles/${api}/download/${scheme}/${system}${path}/?${q}`;
  const request = await fetch(url);

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
  const { length } = action.payload.file;
  yield call(
    downloadUtil,
    'tapis',
    'private',
    action.payload.file.system,
    action.payload.file.path,
    href,
    length
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
  const { result } = yield race({
    result: all(trashCalls),
    cancel: take('DATA_FILES_MODAL_CLOSE')
  });
  if (!result.includes('ERR')) {
    yield put({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'trash', props: {} }
    });
    yield put({
      type: 'ADD_TOAST',
      payload: {
        message: `${
          result.length > 1 ? `${result.length} files` : 'File'
        } moved to trash`
      }
    });
  }
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
    return 'ERR';
  }
  return 'SUCCESS';
}

export const getLatestApp = async name => {
  const res = await fetchUtil({
    url: '/api/workspace/apps',
    params: {
      publicOnly: true,
      name
    }
  });
  const apps = res.response.appListing;
  const latestApp = apps
    .filter(app => app.id.includes(name))
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
  return latestApp.id;
};

const getExtractParams = (file, latestExtract) => {
  const inputFile = `agave://${file.system}${file.path}`;
  const archivePath = `agave://${file.system}${file.path.substring(
    0,
    file.path.lastIndexOf('/') + 1
  )}`;
  return JSON.stringify({
    allocation: 'FORK',
    appId: latestExtract,
    archive: true,
    archivePath,
    inputs: {
      inputFile
    },
    maxRunTime: '02:00:00',
    name: 'Extracting Compressed File',
    parameters: {}
  });
};

export const extractAppSelector = state => state.workbench.config.extractApp;

export function* extractFiles(action) {
  try {
    const extractApp = yield select(extractAppSelector);
    const latestExtract = yield call(getLatestApp, extractApp);
    const params = getExtractParams(action.payload.file, latestExtract);
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
            system: submission.execSys,
            onCancel: {
              type: 'DATA_FILES_SET_OPERATION_STATUS',
              payload: { status: 'ERROR', operation: 'extract' }
            }
          }
        }
      });
    } else if (submission.status === 'ACCEPTED') {
      yield put({
        type: 'DATA_FILES_SET_OPERATION_STATUS',
        payload: { status: 'SUCCESS', operation: 'extract' }
      });
      yield put({
        type: 'DATA_FILES_TOGGLE_MODAL',
        payload: { operation: 'extract', props: {} }
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
const getCompressParams = (files, zipfileName, latestZippy) => {
  const inputs = {
    inputFiles: files.map(file => `agave://${file.system}${file.path}`)
  };
  const parameters = {
    filenames: files.reduce((names, file) => `${names}"${file.name}" `, ''),
    zipfileName,
    compression_type: zipfileName.endsWith('.tar.gz') ? 'tgz' : 'zip'
  };
  const archivePath = `agave://${files[0].system}${files[0].path.substring(
    0,
    files[0].path.lastIndexOf('/') + 1
  )}`;

  return JSON.stringify({
    allocation: 'FORK',
    appId: latestZippy,
    archive: true,
    archivePath,
    maxRunTime: '02:00:00',
    name: 'Compressing Files',
    inputs,
    parameters
  });
};

export const compressAppSelector = state => state.workbench.config.compressApp;

export function* compressFiles(action) {
  const compressErrorAction = {
    type: 'DATA_FILES_SET_OPERATION_STATUS',
    payload: { status: 'ERROR', operation: 'compress' }
  };
  try {
    const compressApp = yield select(compressAppSelector);
    const latestZippy = yield call(getLatestApp, compressApp);
    const params = getCompressParams(
      action.payload.files,
      action.payload.filename,
      latestZippy
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
            system: submission.execSys,
            onCancel: compressErrorAction
          }
        }
      });
    } else if (submission.status === 'ACCEPTED') {
      yield put({
        type: 'DATA_FILES_SET_OPERATION_STATUS',
        payload: { status: 'SUCCESS', operation: 'compress' }
      });
      yield put({
        type: 'DATA_FILES_TOGGLE_MODAL',
        payload: { operation: 'compress', props: {} }
      });
    } else {
      throw new Error('Unable to compress files');
    }
  } catch (error) {
    yield put(compressErrorAction);
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

export async function makePublicUtil(api, scheme, system, path) {
  const url = removeDuplicateSlashes(
    `/api/datafiles/${api}/makepublic/${scheme}/${system}${path}/`
  );
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

export function* doMakePublic(action) {
  const { system, path } = action.payload;
  yield call(makePublicUtil, 'tapis', 'private', system, path);
}

export function* watchMakePublic() {
  yield takeLeading('DATA_FILES_MAKE_PUBLIC', doMakePublic);
}
