import React from "react";
import { Router, useHistory } from "react-router-dom";
import { render, fireEvent } from "@testing-library/react";
import { createMemoryHistory } from "history";
import DataFilesBreadcrumbs from "./DataFilesBreadcrumbs";
import configureStore from "redux-mock-store";
import { Provider } from "react-redux";

function renderComponent(component, store, history) {
  return render(
    <Provider store={store}>
      <Router history={history}>{component}</Router>
    </Provider>
  );
}

const mockStore = configureStore();

describe("DataFilesBreadcrumbs", () => {
  it("render breadcrumbs", () => {
    const history = createMemoryHistory();
    const { getByText, debug } = renderComponent(
        <DataFilesBreadcrumbs
          api="tapis"
          scheme="private"
          system="test.system"
          path="/path/to/the/files"
          section="FilesListing"
        />,
        mockStore({}),
        createMemoryHistory()
    );

    expect(getByText(/My Data/)).toBeDefined();
    expect(
      getByText(/My Data/)
        .closest("a")
        .getAttribute("href")
    ).toEqual("/workbench/data/tapis/private/test.system/");
    expect(getByText(/\/...\/...\//)).toBeDefined()
    expect(
      getByText(/the/)
        .closest("a")
        .getAttribute("href")
    ).toEqual("/workbench/data/tapis/private/test.system/path/to/the/");
    expect(
      getByText(/files/)
        .closest("a")
        .getAttribute("href")
    ).toEqual("/workbench/data/tapis/private/test.system/path/to/the/files/");
  });
});
