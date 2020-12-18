import fetch from 'cross-fetch';
import fetchMock from 'fetch-mock';
import { runSaga } from 'redux-saga';
import { put, call, takeLatest } from 'redux-saga/effects';
import {
  removeDuplicateSlashes,
  fetchFiles,
  fetchSystems,
  fetchSystemsUtil,
  fetchFilesUtil,
  scrollFiles,
  copyFileUtil,
  fileLinkUtil,
  fileLink,
} from "./datafiles.sagas";
//import fetchMock from "fetch-mock";
import { expectSaga } from 'redux-saga-test-plan';
import { throwError } from 'redux-saga-test-plan/providers';
import * as matchers from 'redux-saga-test-plan/matchers';

jest.mock('cross-fetch');

describe('fetchSystems', () => {
  beforeEach(() => {
    const fm = fetchMock.sandbox().mock(`/api/datafiles/systems/list/`, {
      body: { private: 'test.private' },
      status: 200
    });
    fetch.mockImplementation(fm);
  });

  it('runs saga', async () => {
    return expectSaga(fetchSystems)
      .provide([
        [matchers.call.fn(fetchSystemsUtil), { private: 'test.private' }]
      ])
      .call(fetchSystemsUtil)
      .put({
        type: 'FETCH_SYSTEMS_SUCCESS',
        payload: { private: 'test.private' }
      })
      .run();
  });

  it('catches errors in system retrieval', async () => {
    return expectSaga(fetchSystems)
      .provide([
        [matchers.call.fn(fetchSystemsUtil), throwError(new Error('error'))]
      ])
      .call(fetchSystemsUtil)
      .put({
        type: 'FETCH_SYSTEMS_ERROR',
        payload: 'error'
      })
      .run();
  });

  it('runs fetch', () => {
    const apiResult = fetchSystemsUtil();
    expect(apiResult).resolves.toEqual({ private: 'test.private' });
    expect(fetch).toBeCalledWith('/api/datafiles/systems/list/');
  });
});

describe('fetchFiles', () => {
  beforeEach(() => {
    const fm = fetchMock
      .sandbox()
      .mock(
        '/api/datafiles/tapis/listing/private/test.system/path/to/file?limit=100&nextPageToken&offset=0&query_string=',
        {
          body: { data: '200 response' },
          status: 200
        }
      );
    fetch.mockImplementation(fm);
  });

  it('runs fetchFiles saga with success', () => {
    return expectSaga(fetchFiles, {
      payload: {
        section: 'FilesListing',
        api: 'tapis',
        scheme: 'private',
        system: 'test.system',
        path: 'path/to/file',
        offset: 0,
        limit: 100
      }
    })
      .provide([
        [
          matchers.call.fn(fetchFilesUtil),
          {
            listing: [{ name: 'testfile', system: 'test.system' }],
            reachedEnd: true
          }
        ]
      ])
      .put({
        type: 'FETCH_FILES_START',
        payload: {
          section: 'FilesListing',
          params: {
            api: 'tapis',
            scheme: 'private',
            system: 'test.system',
            path: 'path/to/file'
          }
        }
      })
      .call(
        fetchFilesUtil,
        'tapis',
        'private',
        'test.system',
        'path/to/file',
        0,
        100,
        undefined
      )
      .put({
        type: 'FETCH_FILES_SUCCESS',
        payload: {
          files: [{ name: 'testfile', system: 'test.system' }],
          reachedEnd: true,
          section: 'FilesListing',
          nextPageToken: undefined
        }
      })
      .run();
  });

  it('runs fetchFiles saga with error', () => {
    return expectSaga(fetchFiles, {
      payload: {
        section: 'FilesListing',
        api: 'tapis',
        scheme: 'private',
        system: 'test.system',
        path: 'path/to/file',
        offset: 0,
        limit: 100
      }
    })
      .provide([
        [
          matchers.call.fn(fetchFilesUtil),
          throwError({ message: '404', status: 404 })
        ]
      ])
      .put({
        type: 'FETCH_FILES_START',
        payload: {
          section: 'FilesListing',
          params: {
            api: 'tapis',
            scheme: 'private',
            system: 'test.system',
            path: 'path/to/file'
          }
        }
      })
      .call(
        fetchFilesUtil,
        'tapis',
        'private',
        'test.system',
        'path/to/file',
        0,
        100,
        undefined
      )
      .put({
        type: 'FETCH_FILES_ERROR',
        payload: {
          section: 'FilesListing',
          code: '404'
        }
      })
      .run();
  });

  it('test fetchFilesUtil makes correct call', () => {
    const apiResult = fetchFilesUtil(
      'tapis',
      'private',
      'test.system',
      'path/to/file',
      0,
      100,
      undefined
    );
    expect(apiResult).resolves.toEqual('200 response');
    expect(fetch).toBeCalledWith(
      '/api/datafiles/tapis/listing/private/test.system/path/to/file?limit=100&nextPageToken&offset=0&query_string='
    );
  });
});

describe('scrollFiles', () => {
  it('runs scrollFiles saga with success', () => {
    return expectSaga(scrollFiles, {
      payload: {
        section: 'FilesListing',
        api: 'tapis',
        scheme: 'private',
        system: 'test.system',
        path: 'path/to/file',
        offset: 0,
        limit: 100
      }
    })
      .provide([
        [
          matchers.call.fn(fetchFilesUtil),
          {
            listing: [{ name: 'testfile', system: 'test.system' }],
            reachedEnd: true
          }
        ]
      ])
      .put({
        type: 'SCROLL_FILES_START',
        payload: {
          section: 'FilesListing'
        }
      })
      .call(
        fetchFilesUtil,
        'tapis',
        'private',
        'test.system',
        'path/to/file',
        0,
        100,
        undefined,
        undefined
      )
      .put({
        type: 'SCROLL_FILES_SUCCESS',
        payload: {
          files: [{ name: 'testfile', system: 'test.system' }],
          reachedEnd: true,
          section: 'FilesListing',
          nextPageToken: undefined
        }
      })
      .run();
  });
});

describe('copyFiles', () => {
  beforeEach(() => {
    const fm = fetchMock
      .sandbox()
      .put('/api/datafiles/tapis/copy/private/test.system/testpath/', {
        body: { data: '200 response' },
        status: 200
      })
      .put('/api/datafiles/transfer/dir/', {
        body: { data: '200 response' },
        status: 200
      });
    fetch.mockImplementation(fm);
  });

  it('copy util works when src/dest APIs match', () => {
    const apiResult = copyFileUtil(
      'tapis',
      'private',
      'test.system',
      'testpath',
      'testfilename',
      'dir',
      'tapis',
      'test.system',
      'testpath2',
      'destname'
    );
    expect(apiResult).resolves.toEqual('200 response');
    expect(fetch).toBeCalledWith(
      '/api/datafiles/tapis/copy/private/test.system/testpath/',
      {
        body:
          '{"dest_system":"test.system","dest_path":"testpath2","file_name":"testfilename","filetype":"dir","dest_path_name":"destname"}',
        credentials: 'same-origin',
        headers: { 'X-CSRFToken': undefined },
        method: 'PUT'
      }
    );
  });

  it('copy util works when src/dest APIs differ', () => {
    const apiResult = copyFileUtil(
      'tapis',
      'private',
      'test.system',
      'testpath',
      'testfilename',
      'dir',
      'other',
      'test.system2',
      'testpath2',
      'destname'
    );
    const expectedBody = {
      src_api: 'tapis',
      dest_api: 'other',
      src_system: 'test.system',
      dest_system: 'test.system2',
      src_path: 'testpath',
      dest_path: 'testpath2',
      dest_path_name: 'destname',
      dirname: 'testfilename'
    };
    expect(apiResult).resolves.toEqual('200 response');
    expect(fetch).toBeCalledWith('/api/datafiles/transfer/dir/', {
      body: JSON.stringify(expectedBody),
      credentials: 'same-origin',
      headers: { 'X-CSRFToken': undefined },
      method: 'PUT'
    });
  });
});

describe('removeDuplicateSlashes', () => {
  it('removes slashes', () => {
    const url = '/path//to///file';
    expect(removeDuplicateSlashes(url)).toEqual('/path/to/file');
  });
});

describe("fileLink", () => {
  it("performs a fileLink operation", () => {
    return expectSaga(fileLink, {
      payload: {
        scheme: "private",
        file: {
          system: "test.system",
          path: "path/to/file"
        },
        method: 'get'
      }
    })
      .provide([
        [
          matchers.call.fn(fileLinkUtil),
          {
            data: 'https://postit'
          }
        ]
      ])
      .put({
        type: "DATA_FILES_SET_OPERATION_STATUS",
        payload: {
          status: {
            method: 'get',
            url: '',
            error: null,
            loading: true
          },
          operation: 'link'
        }
      })
      .call(
        fileLinkUtil,
        "get",
        "private",
        "test.system",
        "path/to/file",
      )
      .put({
        type: "DATA_FILES_SET_OPERATION_STATUS",
        payload: {
          status: {
            method: null,
            url: 'https://postit',
            error: null,
            loading: false
          },
          operation: 'link'
        }
      })
      .run();
  });
});