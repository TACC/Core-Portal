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
  select,
} from 'redux-saga/effects';
import { fetchUtil } from 'utils/fetchUtil';
import truncateMiddle from '../../utils/truncateMiddle';
import { fetchAppDefinitionUtil } from './apps.sagas';

/**
 * Utility function to replace instances of 2 or more slashes in a URL with
 * a single slash.
 * @param {string} url
 */
export const removeDuplicateSlashes = (url) => {
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
  const responseJson = await response.json();
  if (!response.ok) {
    const err = new Error('Error fetching system definition');
    err.status = response.status;
    err.data = responseJson;
    throw err;
  }
  return responseJson;
}

export function* fetchSystemDefinition(action) {
  yield put({ type: 'FETCH_SYSTEM_DEFINITION_STARTED' });
  try {
    const systemJson = yield call(fetchSystemDefinitionUtil, action.payload);
    yield put({
      type: 'FETCH_SYSTEM_DEFINITION_SUCCESS',
      payload: systemJson.response,
    });
  } catch (e) {
    yield put({
      type: 'FETCH_SYSTEM_DEFINITION_ERROR',
      payload: { message: e.data.message, status: e.status },
    });
  }
}

export function* watchFetchSystems() {
  // The result of the systems call shouldn't change so we only care about
  // the first result.
  yield takeLeading('FETCH_SYSTEMS', fetchSystems);
  yield takeLeading('FETCH_SYSTEM_DEFINITION', fetchSystemDefinition);
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
    nextPageToken,
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
        path: action.payload.path || '',
      },
    },
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
        section: action.payload.section,
      },
    });
  } catch (e) {
    yield put({
      type: 'FETCH_FILES_ERROR',
      payload: {
        section: action.payload.section,
        // When there isn't a status due to network connection error return 503.
        code: e.status ? e.status.toString() : '503',
      },
    });
    // If listing returns 500, body should contain a system def for key pushing.
    yield (e.status === 500 || e.status === 401) &&
      put({
        type: 'SET_SYSTEM',
        payload: {
          system: e.data.system,
        },
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
      section: action.payload.section,
    },
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
        section: action.payload.section,
      },
    });
  } catch (e) {
    yield put({
      type: 'SCROLL_FILES_ERR',
      payload: {
        section: action.payload.section,
      },
    });
  }
}

export async function renameFileUtil(api, scheme, system, path, newName) {
  const url = `/api/datafiles/${api}/rename/${scheme}/${system}/${path}/`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'X-CSRFToken': Cookies.get('csrftoken') },
    credentials: 'same-origin',
    body: JSON.stringify({ new_name: newName }),
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
    payload: { status: 'RUNNING', operation: 'rename' },
  });
  try {
    const response = yield call(
      renameFileUtil,
      action.payload.api,
      action.payload.scheme,
      file.system,
      '/' + file.path,
      action.payload.newName
    );
    yield put({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { status: 'SUCCESS', operation: 'rename' },
    });
    yield call(action.payload.reloadCallback, response.name, response.path);
    yield put({
      type: 'ADD_TOAST',
      payload: {
        message: `${file.name} renamed to ${truncateMiddle(
          action.payload.newName,
          20
        )}`,
      },
    });
  } catch (e) {
    yield put({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { status: 'ERROR', operation: 'rename' },
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
  const url = `/api/datafiles/${api}/move/${scheme}/${system}/${path}/`;
  const request = await fetch(url, {
    method: 'PUT',
    headers: { 'X-CSRFToken': Cookies.get('csrftoken') },
    credentials: 'same-origin',
    body: JSON.stringify({ dest_system: destSystem, dest_path: destPath }),
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
    payload: { status: 'RUNNING', key: index, operation: 'move' },
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
      payload: { status: 'SUCCESS', key: index, operation: 'move' },
    });
  } catch (e) {
    yield put({
      type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
      payload: { status: 'ERROR', key: index, operation: 'move' },
    });
    return 'ERR';
  }
  return 'SUCCESS';
}
export function* moveFiles(action) {
  const { dest } = action.payload;
  const moveCalls = action.payload.src.map((file) => {
    return call(moveFile, file, dest, file.id);
  });
  const { result } = yield race({
    result: all(moveCalls),
    cancel: take('DATA_FILES_MODAL_CLOSE'),
  });
  if (!result.includes('ERR')) {
    yield put({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'move', props: {} },
    });
    yield put({
      type: 'ADD_TOAST',
      payload: {
        message: `${
          result.length > 1 ? `${result.length} files` : 'File'
        } moved to ${truncateMiddle(action.payload.dest.path, 20) || '/'}`,
      },
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
      dest_path_name: destPathName,
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
      dirname: filename,
    };
  }

  const request = await fetch(url, {
    method: 'PUT',
    headers: { 'X-CSRFToken': Cookies.get('csrftoken') },
    credentials: 'same-origin',
    body: JSON.stringify(body),
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
    payload: { status: 'RUNNING', key: index, operation: 'copy' },
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
      payload: { status: 'SUCCESS', key: index, operation: 'copy' },
    });
  } catch (e) {
    yield put({
      type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
      payload: { status: 'ERROR', key: index, operation: 'copy' },
    });
    return 'ERR';
  }
  return 'SUCCESS';
}
export function* copyFiles(action) {
  const { dest } = action.payload;
  const copyCalls = action.payload.src.map((file) => {
    return call(copyFile, file, dest, file.id);
  });
  const { result } = yield race({
    result: all(copyCalls),
    cancel: take('DATA_FILES_MODAL_CLOSE'),
  });
  if (!result.includes('ERR')) {
    yield put({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'copy', props: {} },
    });
    yield put({
      type: 'ADD_TOAST',
      payload: {
        message: `${
          result.length > 1 ? `${result.length} files` : 'File'
        } copied to ${truncateMiddle(`${dest.path}`, 20) || '/'}`,
      },
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

  const url = removeDuplicateSlashes(
    `/api/datafiles/${api}/upload/${scheme}/${system}/${apiPath}/`
  );

  const request = await fetch(url, {
    method: 'POST',
    headers: { 'X-CSRFToken': Cookies.get('csrftoken') },
    credentials: 'same-origin',
    body: formData,
  });
  if (!request.ok) {
    // Error Information is here
    // 403, 404, Inline and UI
    // Tapis Errors, Inline
    /*
    switch (code) {
      case 400:
        if (ClientTapisMessage) {
          return 'themessage';
        }
        // Return client side message
        return message;
    }
    */
    console.log(request);
    throw new Error(request.status);
  }
  return request;
}

export function* watchUpload() {
  yield takeLeading('DATA_FILES_UPLOAD', uploadFiles);
}

export function* uploadFiles(action) {
  const uploadCalls = action.payload.files.map((file) => {
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
    cancel: take('DATA_FILES_MODAL_CLOSE'),
  });

  if (!result.includes('ERR'))
    yield put({
      type: 'ADD_TOAST',
      payload: {
        message: `${
          result.length > 1 ? `${result.length} files` : 'File'
        } uploaded to ${truncateMiddle(action.payload.path, 20) || '/'}`,
      },
    });

  yield call(action.payload.reloadCallback);
}

export function* uploadFile(api, scheme, system, path, file, index) {
  console.log('Need to upload at ');
  console.log('System', system);
  console.log('Path', path);
  console.log('File', file);
  yield put({
    type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
    payload: { status: 'UPLOADING', key: index, operation: 'upload' },
  });
  try {
    yield call(uploadFileUtil, api, scheme, system, path, file);
    yield put({
      type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
      payload: { status: 'SUCCESS', key: index, operation: 'upload' },
    });
  } catch (e) {
    console.log('Found an error of', e);
    yield put({
      type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
      payload: { status: 'ERROR', key: index, operation: 'upload' },
    });
    // Add description of error to the state with some kind of put to a reducer

    yield put({
      type: 'DATA_FILES_SET_ERROR',
      payload: { message: 'Error Right here' },
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
    payload: { href: null, content: null, error: null, isLoading: true },
  });
  try {
    if (action.payload.api !== 'tapis')
      throw new Error('Previewable files must use TAPIS');
    const response = yield call(
      previewUtil,
      action.payload.api,
      action.payload.scheme,
      action.payload.system,
      action.payload.path
    );
    yield put({
      type: 'DATA_FILES_SET_PREVIEW_CONTENT',
      payload: { ...response, isLoading: false },
    });
  } catch (e) {
    yield put({
      type: 'DATA_FILES_SET_PREVIEW_CONTENT',
      payload: {
        content: null,
        href: null,
        error: 'Unable to show preview.',
        isLoading: false,
      },
    });
  }
}

export async function previewUtil(api, scheme, system, path) {
  const url = `/api/datafiles/${api}/preview/${scheme}/${system}/${path}`;
  const request = await fetch(url);
  const requestJson = await request.json();
  return requestJson.data;
}

export async function mkdirUtil(api, scheme, system, path, dirname) {
  let apiPath = !path || path[0] === '/' ? path : `/${path}`;
  if (apiPath === '/') {
    apiPath = '';
  }

  const url = removeDuplicateSlashes(
    `/api/datafiles/${api}/mkdir/${scheme}/${system}/${apiPath}/`
  );

  const request = await fetch(url, {
    method: 'PUT',
    headers: { 'X-CSRFToken': Cookies.get('csrftoken') },
    credentials: 'same-origin',
    body: JSON.stringify({ dir_name: dirname }),
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
      props: {},
    },
  });
}

export async function fileLinkUtil(method, scheme, system, path) {
  const url = `/api/datafiles/link/${scheme}/${system}/${path}/`;
  return fetchUtil({
    url,
    method,
    headers: {
      'Content-Type': 'application/json',
    },
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
        expiration: null,
        error: null,
        loading: true,
      },
      operation: 'link',
    },
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
            expiration: null,
            error: null,
            loading: false,
          },
          operation: 'link',
        },
      });
      return;
    }
    yield put({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: {
        status: {
          method: null,
          url: result.data || '',
          expiration: result.expiration || '',
          error: null,
          loading: false,
        },
        operation: 'link',
      },
    });
  } catch (error) {
    yield put({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: {
        status: {
          method: null,
          url: '',
          expiration: null,
          error: error.toString(),
          loading: false,
        },
        operation: 'link',
      },
    });
  }
}

export async function downloadUtil(api, scheme, system, path) {
  const url = `/api/datafiles/${api}/download/${scheme}/${system}/${path}`;
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
  yield call(
    downloadUtil,
    'tapis',
    'private',
    action.payload.file.system,
    action.payload.file.path
  );
}

export async function trashUtil(api, scheme, system, path, homeDir) {
  const url = `/api/datafiles/${api}/trash/${scheme}/${system}/${path}/`;
  const request = await fetch(url, {
    method: 'PUT',
    headers: { 'X-CSRFToken': Cookies.get('csrftoken') },
    credentials: 'same-origin',
    body: JSON.stringify({
      homeDir: homeDir,
    }),
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
  const trashCalls = action.payload.src.map((file) => {
    return call(trashFile, file.system, file.path, action.payload.homeDir);
  });
  const { result } = yield race({
    result: all(trashCalls),
    cancel: take('DATA_FILES_MODAL_CLOSE'),
  });
  if (!result.includes('ERR')) {
    yield put({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'trash', props: {} },
    });
    yield put({
      type: 'ADD_TOAST',
      payload: {
        message: `${
          result.length > 1 ? `${result.length} files` : 'File'
        } moved to trash`,
      },
    });
  }
  yield call(action.payload.reloadCallback);
}

export function* trashFile(system, path, homeDir) {
  yield put({
    type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
    payload: { status: 'RUNNING', key: system + path, operation: 'trash' },
  });
  try {
    yield call(trashUtil, 'tapis', 'private', system, path, homeDir);

    yield put({
      type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
      payload: { status: 'SUCCESS', key: system + path, operation: 'trash' },
    });
  } catch (e) {
    yield put({
      type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
      payload: { status: 'ERROR', key: system + path, operation: 'trash' },
    });
  }
}

export async function emptyUtil(api, scheme, system, path) {
  const url = `/api/datafiles/${api}/delete/${scheme}/${system}/${path}/`;
  const method = 'PUT';
  return fetchUtil({
    url,
    method,
    body: JSON.stringify({}),
  });
}

export function* watchEmpty() {
  yield takeLeading('DATA_FILES_EMPTY', emptyFiles);
}

export function* emptyFiles(action) {
  const emptyCalls = action.payload.src.map((file) => {
    return call(emptyFile, file.system, file.path);
  });
  try {
    const { result } = yield race({
      result: all(emptyCalls),
      cancel: take('DATA_FILES_MODAL_CLOSE'),
    });
    yield put({
      type: 'ADD_TOAST',
      payload: {
        message: `${result.length > 1 ? `${result.length} files` : 'File'} ${
          !result.includes('ERR') ? 'deleted' : 'failed to delete'
        }`,
      },
    });
  } catch {
    yield put({
      type: 'ADD_TOAST',
      payload: {
        message: 'File(s) failed to delete',
      },
    });
  }
  yield put({
    type: 'DATA_FILES_TOGGLE_MODAL',
    payload: { operation: 'empty', props: {} },
  });
  yield call(action.payload.reloadCallback);
}

export function* emptyFile(system, path) {
  yield put({
    type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
    payload: { status: 'RUNNING', key: system + path, operation: 'empty' },
  });
  try {
    yield call(emptyUtil, 'tapis', 'private', system, path);

    yield put({
      type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
      payload: { status: 'SUCCESS', key: system + path, operation: 'empty' },
    });
  } catch (e) {
    yield put({
      type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
      payload: { status: 'ERROR', key: system + path, operation: 'empty' },
    });
    return 'ERR';
  }
  return 'SUCCESS';
}

export const defaultAllocationSelector = (state) =>
  state.allocations.portal_alloc || state.allocations.active[0].projectName;

const getExtractParams = (file, latestExtract, defaultAllocation) => {
  const inputFile = `tapis://${file.system}/${file.path}`;
  const archivePath = `${file.path.slice(0, -file.name.length)}`;
  return JSON.stringify({
    job: {
      fileInputs: [
        {
          name: 'Input File',
          sourceUrl: inputFile,
        },
      ],
      name: `${latestExtract.definition.id}-${
        latestExtract.definition.version
      }_${new Date().toISOString().split('.')[0]}`,
      archiveSystemId: file.system,
      archiveSystemDir: archivePath,
      archiveOnAppError: false,
      appId: latestExtract.definition.id,
      appVersion: latestExtract.definition.version,
      parameterSet: {
        appArgs: [],
        schedulerOptions: [
          {
            name: 'TACC Allocation',
            description:
              'The TACC allocation associated with this job execution',
            include: true,
            arg: `-A ${defaultAllocation}`,
          },
        ],
      },
      execSystemId: latestExtract.definition.jobAttributes.execSystemId,
    },
  });
};

export const extractAppSelector = (state) => state.workbench.config.extractApp;

export function* extractFiles(action) {
  try {
    yield put({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { status: 'RUNNING', operation: 'extract' },
    });
    const extractApp = yield select(extractAppSelector);
    const defaultAllocation = yield select(defaultAllocationSelector);
    const latestExtract = yield call(fetchAppDefinitionUtil, extractApp);
    const params = getExtractParams(
      action.payload.file,
      latestExtract,
      defaultAllocation
    );
    const res = yield call(jobHelper, params);
    // If the execution system requires pushing keys, then
    // bring up the modal and retry the extract action
    if (res.execSys) {
      yield put({
        type: 'SYSTEMS_TOGGLE_MODAL',
        payload: {
          operation: 'pushKeys',
          props: {
            onSuccess: action,
            system: res.execSys,
            onCancel: {
              type: 'DATA_FILES_SET_OPERATION_STATUS',
              payload: { status: 'ERROR', operation: 'extract' },
            },
          },
        },
      });
    } else if (res.status === 'PENDING') {
      yield put({
        type: 'DATA_FILES_SET_OPERATION_STATUS',
        payload: { status: 'SUCCESS', operation: 'extract' },
      });
      yield put({
        type: 'DATA_FILES_TOGGLE_MODAL',
        payload: { operation: 'extract', props: {} },
      });
    } else {
      throw new Error('Unable to extract files');
    }
    if (action.payload.onSuccess) {
      yield put(action.payload.onSuccess);
    }
  } catch (error) {
    yield put({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { status: 'ERROR', operation: 'extract' },
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
 * @param {String} archiveFileName
 * @returns {String}
 */
const getCompressParams = (
  files,
  archiveFileName,
  compressionType,
  defaultPrivateSystem,
  latestCompress,
  defaultAllocation
) => {
  const fileInputs = files.map((file) => ({
    sourceUrl: `tapis://${file.system}/${file.path}`,
  }));

  let archivePath, archiveSystem;

  if (defaultPrivateSystem) {
    archivePath = defaultPrivateSystem.homeDir;
    archiveSystem = defaultPrivateSystem.system;
  } else {
    archivePath = `${files[0].path.slice(0, -files[0].name.length)}`;
    archiveSystem = files[0].system;
  }

  return JSON.stringify({
    job: {
      fileInputs: fileInputs,
      name: `${latestCompress.definition.id}-${
        latestCompress.definition.version
      }_${new Date().toISOString().split('.')[0]}`,
      archiveSystemId: archiveSystem,
      archiveSystemDir: archivePath,
      archiveOnAppError: false,
      appId: latestCompress.definition.id,
      appVersion: latestCompress.definition.version,
      parameterSet: {
        appArgs: [
          {
            name: 'Archive File Name',
            arg: archiveFileName,
          },
          {
            name: 'Compression Type',
            arg: compressionType,
          },
        ],
        schedulerOptions: [
          {
            name: 'TACC Allocation',
            description:
              'The TACC allocation associated with this job execution',
            include: true,
            arg: `-A ${defaultAllocation}`,
          },
        ],
      },
      execSystemId: latestCompress.definition.jobAttributes.execSystemId,
    },
  });
};

export const compressAppSelector = (state) =>
  state.workbench.config.compressApp;

export const systemsSelector = (state) => state.systems.storage.configuration;

export function* compressFiles(action) {
  const compressErrorAction = (errorMessage) => {
    return {
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: {
        status: { type: 'ERROR', message: errorMessage },
        operation: 'compress',
      },
    };
  };

  try {
    yield put({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { status: { type: 'RUNNING' }, operation: 'compress' },
    });
    const compressApp = yield select(compressAppSelector);
    const defaultAllocation = yield select(defaultAllocationSelector);
    const latestCompress = yield call(fetchAppDefinitionUtil, compressApp);
    const systems = yield select(systemsSelector);

    let defaultPrivateSystem;

    if (
      action.payload.scheme !== 'private' &&
      action.payload.scheme !== 'projects'
    ) {
      defaultPrivateSystem = systems.find((s) => s.default);

      if (!defaultPrivateSystem) {
        throw new Error('Folder downloads are unavailable in this portal', {
          cause: 'compressError',
        });
      }
    }

    const params = getCompressParams(
      action.payload.files,
      action.payload.filename,
      action.payload.compressionType,
      defaultPrivateSystem,
      latestCompress,
      defaultAllocation
    );

    const res = yield call(jobHelper, params);
    // If the execution system requires pushing keys, then
    // bring up the modal and retry the compress action
    if (res.execSys) {
      yield put({
        type: 'SYSTEMS_TOGGLE_MODAL',
        payload: {
          operation: 'pushKeys',
          props: {
            onSuccess: action,
            system: res.execSys,
            onCancel: compressErrorAction('An error has occurred'),
          },
        },
      });
    } else if (res.status === 'PENDING') {
      yield put({
        type: 'DATA_FILES_SET_OPERATION_STATUS',
        payload: { status: { type: 'SUCCESS' }, operation: 'compress' },
      });
    } else {
      throw new Error('Unable to compress files', { cause: 'compressError' });
    }
    if (action.payload.onSuccess) {
      yield put(action.payload.onSuccess);
    }
  } catch (error) {
    const errorMessage =
      error.cause === 'compressError' ? error.message : 'An error has occurred';

    yield put(compressErrorAction(errorMessage));
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
    body: JSON.stringify({}),
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
