import fetch from 'cross-fetch';
import fetchMock from 'fetch-mock';
import { vi } from 'vitest';
import {
  removeDuplicateSlashes,
  fetchFiles,
  fetchSystems,
  fetchSystemsUtil,
  fetchFilesUtil,
  scrollFiles,
  extractFiles,
  compressFiles,
  jobHelper,
  fileLinkUtil,
  fileLink,
  copyFileUtil,
  extractAppSelector,
  compressAppSelector,
  makePublicUtil,
  doMakePublic,
  defaultAllocationSelector,
  systemsSelector,
} from './datafiles.sagas';
import { select } from 'redux-saga/effects';
import { expectSaga } from 'redux-saga-test-plan';
import { throwError } from 'redux-saga-test-plan/providers';
import * as matchers from 'redux-saga-test-plan/matchers';
import { fetchAppDefinitionUtil } from './apps.sagas';
import compressApp from './fixtures/compress.fixture';
import extractApp from './fixtures/extract.fixture';
import systemsFixture from '../../components/DataFiles/fixtures/DataFiles.systems.fixture';
import { useCompress } from 'hooks/datafiles/mutations';

vi.mock('cross-fetch');

describe('fetchSystems', () => {
  beforeEach(() => {
    const fm = fetchMock.sandbox().mock(`/api/datafiles/systems/list/`, {
      body: { private: 'test.private' },
      status: 200,
    });
    fetch.mockImplementation(fm);
  });

  afterEach(() => {
    fetchMock.reset();
  });

  it('runs saga', async () => {
    return expectSaga(fetchSystems)
      .provide([
        [matchers.call.fn(fetchSystemsUtil), { private: 'test.private' }],
      ])
      .call(fetchSystemsUtil)
      .put({
        type: 'FETCH_SYSTEMS_SUCCESS',
        payload: { private: 'test.private' },
      })
      .run();
  });

  it('catches errors in system retrieval', async () => {
    return expectSaga(fetchSystems)
      .provide([
        [matchers.call.fn(fetchSystemsUtil), throwError(new Error('error'))],
      ])
      .call(fetchSystemsUtil)
      .put({
        type: 'FETCH_SYSTEMS_ERROR',
        payload: 'error',
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
          status: 200,
        }
      );
    fetch.mockImplementation(fm);
  });

  afterEach(() => {
    fetchMock.reset();
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
        limit: 100,
      },
    })
      .provide([
        [
          matchers.call.fn(fetchFilesUtil),
          {
            listing: [{ name: 'testfile', system: 'test.system' }],
            reachedEnd: true,
          },
        ],
      ])
      .put({
        type: 'FETCH_FILES_START',
        payload: {
          section: 'FilesListing',
          params: {
            api: 'tapis',
            scheme: 'private',
            system: 'test.system',
            path: 'path/to/file',
          },
        },
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
        type: 'FETCH_FILES_SUCCESS',
        payload: {
          files: [{ name: 'testfile', system: 'test.system' }],
          reachedEnd: true,
          section: 'FilesListing',
          nextPageToken: undefined,
        },
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
        limit: 100,
      },
    })
      .provide([
        [
          matchers.call.fn(fetchFilesUtil),
          throwError({ message: '404', status: 404 }),
        ],
      ])
      .put({
        type: 'FETCH_FILES_START',
        payload: {
          section: 'FilesListing',
          params: {
            api: 'tapis',
            scheme: 'private',
            system: 'test.system',
            path: 'path/to/file',
          },
        },
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
        type: 'FETCH_FILES_ERROR',
        payload: {
          section: 'FilesListing',
          code: '404',
        },
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
        limit: 100,
      },
    })
      .provide([
        [
          matchers.call.fn(fetchFilesUtil),
          {
            listing: [{ name: 'testfile', system: 'test.system' }],
            reachedEnd: true,
          },
        ],
      ])
      .put({
        type: 'SCROLL_FILES_START',
        payload: {
          section: 'FilesListing',
        },
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
        undefined,
        undefined
      )
      .put({
        type: 'SCROLL_FILES_SUCCESS',
        payload: {
          files: [{ name: 'testfile', system: 'test.system' }],
          reachedEnd: true,
          section: 'FilesListing',
          nextPageToken: undefined,
        },
      })
      .run();
  });
  it('runs scrollFiles saga with error', () => {
    return expectSaga(scrollFiles, {
      payload: {
        section: 'FilesListing',
        api: 'tapis',
        scheme: 'private',
        system: 'test.system',
        path: 'path/to/file',
        offset: 0,
        limit: 100,
      },
    })
      .provide([[matchers.call.fn(fetchFilesUtil), throwError('Failed!')]])
      .put({
        type: 'SCROLL_FILES_START',
        payload: {
          section: 'FilesListing',
        },
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
        undefined,
        undefined
      )
      .put({
        type: 'SCROLL_FILES_ERR',
        payload: {
          section: 'FilesListing',
        },
      })
      .run();
  });
});

describe('Test extract with different file names', () => {
  // Paths without and with space to ensure there is no encoding.
  const sourceUrlPaths = [
    { tapis_path: 'tapis://test.system/dir/test.zip', name: 'test.zip' },
    {
      tapis_path: 'tapis://test.system/dir/test file.zip',
      name: 'test file.zip',
    },
  ];
  sourceUrlPaths.forEach((pathInfo) => {
    describe('extractFiles', () => {
      const jobHelperExpected = () =>
        JSON.stringify({
          job: {
            fileInputs: [
              {
                name: 'Input File',
                sourceUrl: pathInfo['tapis_path'],
              },
            ],
            name: `extract-express-0.0.1_${new Date().toISOString().split('.')[0]}`,
            archiveSystemId: 'test.system',
            archiveSystemDir: 'dir/',
            archiveOnAppError: false,
            appId: 'extract-express',
            appVersion: '0.0.1',
            parameterSet: {
              appArgs: [],
              schedulerOptions: [
                {
                  name: 'Project Allocation Account',
                  description:
                    'The project allocation account associated with this job execution.',
                  include: true,
                  arg: '-A TACC-ACI',
                },
              ],
            },
            execSystemId: 'frontera',
          },
        });

      const action = {
        type: 'DATA_FILES_EXTRACT',
        payload: {
          file: {
            system: 'test.system',
            path: `dir/${pathInfo['name']}`,
            name: pathInfo['name'],
          },
        },
      };

      it('runs extractFiles saga with success', () => {
        return expectSaga(extractFiles, action)
          .provide([
            [select(extractAppSelector), 'extract-express'],
            [select(defaultAllocationSelector), 'TACC-ACI'],
            [matchers.call.fn(fetchAppDefinitionUtil), extractApp],
            [matchers.call.fn(jobHelper), { status: 'PENDING' }],
          ])
          .call(fetchAppDefinitionUtil, 'extract-express')
          .put({
            type: 'DATA_FILES_SET_OPERATION_STATUS',
            payload: { status: 'RUNNING', operation: 'extract' },
          })
          .call(jobHelper, jobHelperExpected())
          .put({
            type: 'DATA_FILES_SET_OPERATION_STATUS',
            payload: { status: 'SUCCESS', operation: 'extract' },
          })
          .run();
      });

      it('runs extractFiles saga with push keys modal', () => {
        return expectSaga(extractFiles, action)
          .provide([
            [select(extractAppSelector), 'extract-express'],
            [select(defaultAllocationSelector), 'TACC-ACI'],
            [matchers.call.fn(fetchAppDefinitionUtil), extractApp],
            [matchers.call.fn(jobHelper), { execSys: 'test.cli.system' }],
          ])
          .call(fetchAppDefinitionUtil, 'extract-express')
          .put({
            type: 'DATA_FILES_SET_OPERATION_STATUS',
            payload: { status: 'RUNNING', operation: 'extract' },
          })
          .call(jobHelper, jobHelperExpected())
          .put({
            type: 'SYSTEMS_TOGGLE_MODAL',
            payload: {
              operation: 'pushKeys',
              props: {
                onSuccess: action,
                system: 'test.cli.system',
                onCancel: {
                  type: 'DATA_FILES_SET_OPERATION_STATUS',
                  payload: { status: 'ERROR', operation: 'extract' },
                },
              },
            },
          })
          .run();
      });
    });
  });
});

describe('compressFiles', () => {
  const createAction = (scheme) => {
    return {
      type: 'DATA_FILES_COMPRESS',
      payload: {
        filename: 'test',
        files: [
          {
            system: 'test.system',
            path: 'test1.txt',
            name: 'test1.txt',
          },
          {
            system: 'test.system',
            path: 'test 2.txt',
            name: 'test 2.txt',
          },
        ],
        compressionType: 'zip',
        scheme: scheme,
      },
    };
  };

  const createJobHelperExpected = (archiveSystemId, archiveSystemDir) => {
    return JSON.stringify({
      job: {
        fileInputs: [
          {
            sourceUrl: 'tapis://test.system/test1.txt',
          },
          {
            sourceUrl: 'tapis://test.system/test 2.txt',
          },
        ],
        name: `compress-express-0.0.1_${new Date().toISOString().split('.')[0]}`,
        archiveSystemId: archiveSystemId,
        archiveSystemDir: archiveSystemDir,
        archiveOnAppError: false,
        appId: 'compress-express',
        appVersion: '0.0.1',
        parameterSet: {
          appArgs: [
            {
              name: 'Archive File Name',
              arg: 'test',
            },
            {
              name: 'Compression Type',
              arg: 'zip',
            },
          ],
          schedulerOptions: [
            {
              name: 'Project Allocation Account',
              description:
                'The project allocation account associated with this job execution.',
              include: true,
              arg: '-A TACC-ACI',
            },
          ],
        },
        execSystemId: 'frontera',
      },
    });
  };

  it.skip('runs compressFiles saga with success', () => {
    return expectSaga(useCompress, createAction('private'))
      .provide([
        [select(compressAppSelector), 'compress-express'],
        [select(defaultAllocationSelector), 'TACC-ACI'],
        [select(systemsSelector), []],
        [matchers.call.fn(fetchAppDefinitionUtil), compressApp],
        [matchers.call.fn(jobHelper), { status: 'PENDING' }],
      ])
      .call(fetchAppDefinitionUtil, 'compress-express')
      .put({
        type: 'DATA_FILES_SET_OPERATION_STATUS',
        payload: { status: { type: 'RUNNING' }, operation: 'compress' },
      })
      .call(jobHelper, createJobHelperExpected('test.system', ''))
      .put({
        type: 'DATA_FILES_SET_OPERATION_STATUS',
        payload: { status: { type: 'SUCCESS' }, operation: 'compress' },
      })
      .run();
  });

  it.skip('runs compressFiles saga with push keys modal', () => {
    return expectSaga(compressFiles, createAction('private'))
      .provide([
        [select(compressAppSelector), 'compress-express'],
        [select(defaultAllocationSelector), 'TACC-ACI'],
        [select(systemsSelector), []],
        [matchers.call.fn(fetchAppDefinitionUtil), compressApp],
        [matchers.call.fn(jobHelper), { execSys: 'test.cli.system' }],
      ])
      .call(fetchAppDefinitionUtil, 'compress-express')
      .put({
        type: 'DATA_FILES_SET_OPERATION_STATUS',
        payload: { status: { type: 'RUNNING' }, operation: 'compress' },
      })
      .call(jobHelper, createJobHelperExpected('test.system', ''))
      .put({
        type: 'SYSTEMS_TOGGLE_MODAL',
        payload: {
          operation: 'pushKeys',
          props: {
            onSuccess: createAction('private'),
            system: 'test.cli.system',
            onCancel: {
              type: 'DATA_FILES_SET_OPERATION_STATUS',
              payload: {
                status: { type: 'ERROR', message: 'An error has occurred' },
                operation: 'compress',
              },
            },
          },
        },
      })
      .run();
  });

  it.skip('runs compressFiles saga with success for file in a public system', () => {
    return expectSaga(compressFiles, createAction('public'))
      .provide([
        [select(compressAppSelector), 'compress-express'],
        [select(defaultAllocationSelector), 'TACC-ACI'],
        [select(systemsSelector), systemsFixture.storage.configuration],
        [matchers.call.fn(fetchAppDefinitionUtil), compressApp],
        [matchers.call.fn(jobHelper), { status: 'PENDING' }],
      ])
      .call(fetchAppDefinitionUtil, 'compress-express')
      .put({
        type: 'DATA_FILES_SET_OPERATION_STATUS',
        payload: { status: { type: 'RUNNING' }, operation: 'compress' },
      })
      .call(
        jobHelper,
        createJobHelperExpected('corral.home.username', '/home/username')
      )
      .put({
        type: 'DATA_FILES_SET_OPERATION_STATUS',
        payload: { status: { type: 'SUCCESS' }, operation: 'compress' },
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
        status: 200,
      })
      .put('/api/datafiles/transfer/dir/', {
        body: { data: '200 response' },
        status: 200,
      });
    fetch.mockImplementation(fm);
  });

  afterEach(() => {
    fetchMock.reset();
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
    expect(fetch).toBeCalledWith(
      '/api/datafiles/tapis/copy/private/test.system/testpath/',
      {
        body: '{"dest_system":"test.system","dest_path":"testpath2","file_name":"testfilename","filetype":"dir","dest_path_name":"destname"}',
        credentials: 'same-origin',
        headers: { 'X-CSRFToken': undefined },
        method: 'PUT',
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
      dirname: 'testfilename',
    };
    expect(fetch).toBeCalledWith('/api/datafiles/transfer/dir/', {
      body: JSON.stringify(expectedBody),
      credentials: 'same-origin',
      headers: { 'X-CSRFToken': undefined },
      method: 'PUT',
    });
  });
});

describe('removeDuplicateSlashes', () => {
  it('removes slashes', () => {
    const url = '/path//to///file';
    expect(removeDuplicateSlashes(url)).toEqual('/path/to/file');
  });
});

describe('Preview Files', () => {
  it.todo('should fetch and set previews');
  it.todo('should be dispatched by an effect creator');
});

describe('fileLink', () => {
  it('performs a fileLink operation', () => {
    return expectSaga(fileLink, {
      payload: {
        scheme: 'private',
        file: {
          system: 'test.system',
          path: 'path/to/file',
        },
        method: 'get',
      },
    })
      .provide([
        [
          matchers.call.fn(fileLinkUtil),
          {
            data: 'https://postit',
            expiration: '2023-12-12T22:52:06.300829Z',
          },
        ],
      ])
      .put({
        type: 'DATA_FILES_SET_OPERATION_STATUS',
        payload: {
          status: {
            method: 'get',
            url: '',
            expiration: null,
            error: null,
            loading: true,
          },
          operation: 'link',
        },
      })
      .call(fileLinkUtil, 'get', 'private', 'test.system', 'path/to/file')
      .put({
        type: 'DATA_FILES_SET_OPERATION_STATUS',
        payload: {
          status: {
            method: null,
            url: 'https://postit',
            expiration: '2023-12-12T22:52:06.300829Z',
            error: null,
            loading: false,
          },
          operation: 'link',
        },
      })
      .run();
  });
});

describe('makePublic', () => {
  beforeEach(() => {
    const fm = fetchMock
      .sandbox()
      .mock(
        `/api/datafiles/tapis/makepublic/private/test.system/path/to/file/`,
        {
          status: 200,
        }
      );
    fetch.mockImplementation(fm);
  });

  afterEach(() => {
    fetchMock.reset();
  });

  it('runs saga', async () => {
    return expectSaga(doMakePublic, {
      type: 'DATA_FILES_MAKE_PUBLIC',
      payload: { system: 'test.system', path: '/path/to/file' },
    })
      .provide([[matchers.call.fn(makePublicUtil), {}]])
      .call(makePublicUtil, 'tapis', 'private', 'test.system', '/path/to/file')
      .run();
  });

  it('runs fetch', () => {
    makePublicUtil('tapis', 'private', 'test.system', '/path/to/file');
    expect(fetch).toBeCalledWith(
      `/api/datafiles/tapis/makepublic/private/test.system/path/to/file/`,
      {
        body: '{}',
        credentials: 'same-origin',
        headers: { 'X-CSRFToken': undefined },
        method: 'PUT',
      }
    );
  });
});
