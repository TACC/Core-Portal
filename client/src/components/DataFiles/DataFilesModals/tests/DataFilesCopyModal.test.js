import React from "react";
import { Router, Route } from "react-router-dom";
import { render, fireEvent } from "@testing-library/react";
import { createMemoryHistory } from "history";
import  DataFilesCopyModal  from "../DataFilesCopyModal";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import DataFilesCopyModalFixture from './DataFilesCopyModal.fixture';

const mockStore = configureStore();

const initialMockState = {
  files: DataFilesCopyModalFixture
};

function renderComponent(component, store, history) {
  return render(
    <Provider store={store}>
      <Router history={history}>{component}</Router>
    </Provider>
  );
}

describe("DataFilesCopyModal", () => {

  it("renders the copy modal", () => {
    const history = createMemoryHistory();
    history.push("/workbench/data/tapis/private/test.system/");
    const store = mockStore(initialMockState);

    const { getAllByText } = renderComponent(
      <DataFilesCopyModal />,
      store,
      history
    )

    // Check the modal title
    expect(getAllByText(/Copying 1 File/)).toBeDefined();

    // Check for the filename to be present
    expect(getAllByText(/testfile/)).toBeDefined();

    // Check for the list of selected files for copying to contain
    // the size of the file to be copied
    expect(getAllByText(/4.0 kB/)).toBeDefined();

    // Check for the destination list to have a Copy button
    expect(getAllByText(/Copy/)).toBeDefined();
  });
});
