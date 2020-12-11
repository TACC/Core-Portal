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
  fileLinkUtil,
  fileLink,
} from "./datafiles.sagas";
//import fetchMock from "fetch-mock";
import { expectSaga } from "redux-saga-test-plan";
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
            error: null
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
            error: null
          },
          operation: 'link'
        }
      })
      .run();
  });
});