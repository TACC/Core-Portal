import fetch from "cross-fetch";
import fetchMock from "fetch-mock";
import { runSaga } from "redux-saga";
import { put, call, takeLatest } from "redux-saga/effects";
import {
  fetchFiles,
  fetchSystems,
  fetchSystemsUtil,
  fetchFilesUtil,
  scrollFiles,
  getLatestApp,
  extractFiles,
  compressFiles,
  jobHelper
} from "./datafiles.sagas";
import { fetchUtil } from 'utils/fetchUtil';
import { expectSaga, testSaga } from "redux-saga-test-plan";
import { throwError } from "redux-saga-test-plan/providers";
import * as matchers from "redux-saga-test-plan/matchers";

jest.mock("cross-fetch");

describe("fetchSystems", () => {
  beforeEach(() => {
    const fm = fetchMock.sandbox().mock(`/api/datafiles/systems/list/`, {
      body: { private: "test.private" },
      status: 200
    });
    fetch.mockImplementation(fm);
  });

  it("runs saga", async () => {
    return expectSaga(fetchSystems)
      .provide([
        [matchers.call.fn(fetchSystemsUtil), { private: "test.private" }]
      ])
      .call(fetchSystemsUtil)
      .put({
        type: "FETCH_SYSTEMS_SUCCESS",
        payload: { private: "test.private" }
      })
      .run();
  });

  it("catches errors in system retrieval", async () => {
    return expectSaga(fetchSystems)
      .provide([
        [matchers.call.fn(fetchSystemsUtil), throwError(new Error("error"))]
      ])
      .call(fetchSystemsUtil)
      .put({
        type: "FETCH_SYSTEMS_ERROR",
        payload: "error"
      })
      .run();
  });

  it("runs fetch", () => {
    const apiResult = fetchSystemsUtil();
    expect(apiResult).resolves.toEqual({ private: "test.private" });
    expect(fetch).toBeCalledWith("/api/datafiles/systems/list/");
  });
});

describe("fetchFiles", () => {
  beforeEach(() => {
    const fm = fetchMock
      .sandbox()
      .mock(
        "/api/datafiles/tapis/listing/private/test.system/path/to/file?limit=100&offset=0&query_string=",
        {
          body: { data: "200 response" },
          status: 200
        }
      );
    fetch.mockImplementation(fm);
  });

  it("runs fetchFiles saga with success", () => {
    return expectSaga(fetchFiles, {
      payload: {
        section: "FilesListing",
        api: "tapis",
        scheme: "private",
        system: "test.system",
        path: "path/to/file",
        offset: 0,
        limit: 100,
      }
    })
      .provide([
        [
          matchers.call.fn(fetchFilesUtil),
          {
            listing: [{ name: "testfile", system: "test.system" }],
            reachedEnd: true
          }
        ]
      ])
      .put({
        type: "FETCH_FILES_START",
        payload: {
          section: "FilesListing",
          params: {
            api: "tapis", 
            scheme: "private",
            system: "test.system",
            path: "path/to/file"
          }
        }
      })
      .call(
        fetchFilesUtil,
        "tapis",
        "private",
        "test.system",
        "path/to/file",
        0,
        100,
        undefined
      )
      .put({
        type: "FETCH_FILES_SUCCESS",
        payload: {
          files: [{ name: "testfile", system: "test.system" }],
          reachedEnd: true,
          section: "FilesListing"
        }
      })
      .run();
  });

  it("runs fetchFiles saga with error", () => {
    return expectSaga(fetchFiles, {
      payload: {
        section: "FilesListing",
        api: "tapis",
        scheme: "private",
        system: "test.system",
        path: "path/to/file",
        offset: 0,
        limit: 100,
      }
    })
      .provide([[matchers.call.fn(fetchFilesUtil), throwError({message: "404", status: 404})]])
      .put({
        type: "FETCH_FILES_START",
        payload: {
          section: "FilesListing",
          params: {
            api: "tapis", 
            scheme: "private",
            system: "test.system",
            path: "path/to/file"
          }
        }
      })
      .call(
        fetchFilesUtil,
        "tapis",
        "private",
        "test.system",
        "path/to/file",
        0,
        100,
        undefined
      )
      .put({
        type: "FETCH_FILES_ERROR",
        payload: {
          section: "FilesListing",
          code: "404"
        }
      })
      .run();
  });

  it("test fetchFilesUtil makes correct call", () => {
    const apiResult = fetchFilesUtil(
      "tapis",
      "private",
      "test.system",
      "path/to/file",
      0,
      100,
      undefined
    );
    expect(apiResult).resolves.toEqual("200 response");
    expect(fetch).toBeCalledWith(
      "/api/datafiles/tapis/listing/private/test.system/path/to/file?limit=100&offset=0&query_string="
    );
  });
});


describe("scrollFiles", () => {

  it("runs scrollFiles saga with success", () => {
    return expectSaga(scrollFiles, {
      payload: {
        section: "FilesListing",
        api: "tapis",
        scheme: "private",
        system: "test.system",
        path: "path/to/file",
        offset: 0,
        limit: 100
      }
    })
      .provide([
        [
          matchers.call.fn(fetchFilesUtil),
          {
            listing: [{ name: "testfile", system: "test.system" }],
            reachedEnd: true
          }
        ]
      ])
      .put({
        type: "SCROLL_FILES_START",
        payload: {
          section: "FilesListing"
        }
      })
      .call(
        fetchFilesUtil,
        "tapis",
        "private",
        "test.system",
        "path/to/file",
        0,
        100,
        undefined
      )
      .put({
        type: "SCROLL_FILES_SUCCESS",
        payload: {
          files: [{ name: "testfile", system: "test.system" }],
          reachedEnd: true,
          section: "FilesListing"
        }
      })
      .run();
  });
});

describe("extractFiles", () => {
  const jobHelperExpected = JSON.stringify({
    allocation: 'FORK',
    appId: 'extract-frontera-0.1u1',
    archive: true,
    archivePath: 'agave://test.system/dir/',
    inputs: {
      inputFile: 'agave://test.system/dir/test.zip'
    },
    maxRunTime: '02:00:00',
    name: 'Extracting Compressed File',
    parameters: {}
  });

  const action = {
    type: 'DATA_FILES_EXTRACT',
    payload: {
      file: {
        system: 'test.system',
        path: '/dir/test.zip'
      }
    } 
  }

  it("runs extractFiles saga with success", () => {
   return expectSaga(extractFiles, action)
      .provide([
        [ matchers.call.fn(getLatestApp), 'extract-frontera-0.1u1' ],
        [ matchers.call.fn(jobHelper), { status: 'ACCEPTED' } ]
      ])
      .call(getLatestApp, 'extract-frontera')
      .put({
        type: 'DATA_FILES_SET_OPERATION_STATUS',
        payload: { status: 'RUNNING', operation: 'extract' }
      })

      .call(jobHelper, jobHelperExpected)
      .put({
        type: 'DATA_FILES_SET_OPERATION_STATUS',
        payload: { status: 'SUCCESS', operation: 'extract' }
      })
      .run();
  });

  it("runs extractFiles saga with push keys modal", () => {
    return expectSaga(extractFiles, action)
      .provide([
        [ matchers.call.fn(getLatestApp), 'extract-frontera-0.1u1' ],
        [ matchers.call.fn(jobHelper), { execSys: 'test.cli.system' } ]
      ])
      .call(getLatestApp, 'extract-frontera')
      .put({
        type: 'DATA_FILES_SET_OPERATION_STATUS',
        payload: { status: 'RUNNING', operation: 'extract' }
      })

      .call(jobHelper, jobHelperExpected)
      .put({
        type: 'SYSTEMS_TOGGLE_MODAL',
        payload: {
          operation: 'pushKeys',
          props: {
            onSuccess: action,
            system: 'test.cli.system',
            onCancel: {
              type: 'DATA_FILES_SET_OPERATION_STATUS',
              payload: { status: 'ERROR', operation: 'extract' }
            }
          }
        }
      })
      .run();
  });
});

describe("compressFiles", () => {
  const action = {
    type: 'DATA_FILES_COMPRESS',
    payload: {
      filename: 'test.zip',
      files: [
        {
          system: 'test.system',
          path: '/test1.txt',
          name: 'test1.txt'
        },
        {
          system: 'test.system',
          path: '/test2.txt',
          name: 'test2.txt'
        }
      ]
    }
  }

  const jobHelperExpected = JSON.stringify({
    allocation: 'FORK',
    appId: 'zippy-frontera-0.1u1',
    archive: true,
    archivePath: 'agave://test.system/',
    maxRunTime: '02:00:00',
    name: 'Compressing Files',
    inputs: {
      inputFiles: [
        "agave://test.system/test1.txt",
        "agave://test.system/test2.txt"
      ]
    },
    parameters: {
      filenames: '"test1.txt" "test2.txt" ',
      zipfileName: 'test.zip'
    }
  });

  it("runs compressFiles saga with success", () => {
    return expectSaga(compressFiles, action)
      .provide([
        [ matchers.call.fn(getLatestApp), 'zippy-frontera-0.1u1' ],
        [ matchers.call.fn(jobHelper), { status: 'ACCEPTED' } ]
      ])
      .call(getLatestApp, 'zippy-frontera')
      .put({
        type: 'DATA_FILES_SET_OPERATION_STATUS',
        payload: { status: 'RUNNING', operation: 'compress' }
      })
      .call(jobHelper, jobHelperExpected)
      .put({
        type: 'DATA_FILES_SET_OPERATION_STATUS',
        payload: { status: 'SUCCESS', operation: 'compress' }
      })
      .run();
  });

  it("runs compressFiles saga with push keys modal", () => {
    return expectSaga(compressFiles, action)
      .provide([
        [ matchers.call.fn(getLatestApp), 'zippy-frontera-0.1u1' ],
        [ matchers.call.fn(jobHelper), { execSys: 'test.cli.system' } ]
      ])
      .call(getLatestApp, 'zippy-frontera')
      .put({
        type: 'DATA_FILES_SET_OPERATION_STATUS',
        payload: { status: 'RUNNING', operation: 'compress' }
      })
      .call(jobHelper, jobHelperExpected)
      .put({
        type: 'SYSTEMS_TOGGLE_MODAL',
        payload: {
          operation: 'pushKeys',
          props: {
            onSuccess: action,
            system: 'test.cli.system',
            onCancel: {
              type: 'DATA_FILES_SET_OPERATION_STATUS',
              payload: { status: 'ERROR', operation: 'compress' }
            }
          }
        }
      })
      .run();
  });
});
