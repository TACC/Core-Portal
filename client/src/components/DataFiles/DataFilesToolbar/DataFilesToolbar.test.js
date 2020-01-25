import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { Router, Route } from "react-router-dom";
import DataFilesToolbar, { ToolbarButton } from "./DataFilesToolbar";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import configureStore from "redux-mock-store";
import { Provider } from "react-redux";
import { createMemoryHistory } from "history";

function renderComponent(component, store, history) {
  return render(
    <Provider store={store}>
      <Router history={history}>{component}</Router>
    </Provider>
  );
}

const mockStore = configureStore();

describe("ToolbarButton", () => {
  const store = mockStore({})
  it("render button with correct text", () => {
    const { getByText, getByRole } = renderComponent(
      <ToolbarButton text="Test Button" icon={faPen} onClick={() => {}} />,
      store,
      createMemoryHistory()
    );
    expect(getByText(/Test Button/)).toBeDefined();
    expect(getByRole("button")).toBeDefined();
  });
});

describe("DataFilesToolbar", () => {
  it("render necessary buttons", () => {
    const { getByText } = renderComponent(
      <DataFilesToolbar scheme="private" />,
      mockStore({files: {selected: { FilesListing: []}}, listing: {selected: {FilesListing: []}}}),
      createMemoryHistory()
    );

    expect(getByText(/Rename/)).toBeDefined();
    expect(getByText(/Move/)).toBeDefined();
    expect(getByText(/Copy/)).toBeDefined();
    expect(getByText(/Download/)).toBeDefined();
    expect(getByText(/Trash/)).toBeDefined();
  });
});
