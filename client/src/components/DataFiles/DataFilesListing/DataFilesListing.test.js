import React from "react";
import { Router, Route } from "react-router-dom";
import { render, fireEvent } from "@testing-library/react";
import { createMemoryHistory } from "history";
import  DataFilesListing  from "./DataFilesListing";
import { CheckboxCell, FileNavCell } from "./DataFilesListingCells";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";

const mockStore = configureStore();
const initialMockState = {
  files: {
    loading: {
      FilesListing: false
    },
    params: {
      FilesListing: {
        system: "test.system",
        path: "test/path"
      }
    },
    loadingScroll: {
      FilesListing: false
    },
    error: {
      FilesListing: false
    },
    listing: {
      FilesListing: []
    },
    selected: {
      FilesListing: [],
    },
    selectAll: {
      FilesListing: false
    },
    reachedEnd: {
      FilesListing: true
    }
  }
};

function renderComponent(component, store, history) {
  return render(
    <Provider store={store}>
      <Router history={history}>{component}</Router>
    </Provider>
  );
}

describe("CheckBoxCell", () => {
  it("shows checkbox when checked", () => {
    const history = createMemoryHistory();
    const store = mockStore({ files: { selected: { FilesListing: [0] } } });
    const { getAllByRole } = renderComponent(
      <CheckboxCell index={0} />,
      store,
      history
    );
    expect(
      getAllByRole("img", { hidden: true })[1]
        .getAttribute("data-icon")
    ).toEqual("check-square");
  });

  it("shows square when unchecked", () => {
    const history = createMemoryHistory();
    const store = mockStore({ files: { selected: { FilesListing: [] } } });
    const { getAllByRole } = renderComponent(
      <CheckboxCell index={0} />,
      store,
      history
    );
    expect(
      getAllByRole("img", { hidden: true })
        .pop()
        .getAttribute("data-icon")
    ).toEqual("square");
  });
});

describe("FileNavCell", () => {
  it("renders name and link for dir", () => {
    const history = createMemoryHistory();
    const store = mockStore({});
    const { getByText } = renderComponent(
      <FileNavCell system="test.system" path= "/path/to/file" name="Filename" format="folder" api="tapis" scheme="private" href="href" />,
      store,
      history
    );
    expect(getByText("Filename")).toBeDefined();
    expect(
      getByText("Filename")
        .closest("a")
        .getAttribute("href")
    ).toEqual("/workbench/data/tapis/private/test.system/path/to/file/");
  });

  it("renders name if not directory", () => {
    const history = createMemoryHistory();
    const store = mockStore({});
    const { getByText } = renderComponent(
      <FileNavCell system="test.system" path= "/path/to/file" name="Filename" format="file" api="tapis" scheme="private" href="href" />,
      store,
      history
    );
    expect(getByText("Filename")).toBeDefined();
  });
});


describe("DataFilesListing", () => {

  it("renders listing", () => {
    const testfile = {
      system: "test.system",
      path: "/path/to/file",
      name: "testfile",
      format: "file",
      length: 4096,
      lastModified: "2019-06-17T15:49:53-05:00",
      _links: {self: {href: "href.test"}}
    };
    const history = createMemoryHistory();
    history.push("/workbench/data/tapis/private/test.system/");
    const store = mockStore({
      files: {
        ...initialMockState.files,
        listing: { FilesListing: [testfile] }
      }
    });

    const { getByText, getAllByRole } = renderComponent(
        <DataFilesListing api="tapis" scheme="private" system="test.system" path="/" />,
      store,
      history
    );
    expect(getByText("testfile")).toBeDefined();
    expect(getByText("4.0 kB")).toBeDefined();
    /*
    expect(getByText("06/17/2019 15:49")).toBeDefined();
    const row = getAllByRole("row")[0];
    fireEvent.click(row);
    expect(store.getActions()).toEqual([
      { type: "DATA_FILES_TOGGLE_SELECT", payload: { index: 0, section: "FilesListing" } }
    ]);
    */
  });

  
  it("renders message when no files to show", () => {
    const history = createMemoryHistory();
    history.push("/workbench/data/tapis/private/test.system/");
    const store = mockStore(initialMockState);

    const { getByText, debug } = renderComponent(
        <DataFilesListing api="tapis" scheme="private" system="test.system" path="/"  />,
      store,
      history
    );

    expect(getByText(/No files or folders to show/)).toBeDefined();
  });
  
});
