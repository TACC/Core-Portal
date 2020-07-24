import React from "react";
import { render } from '@testing-library/react';
import { toHaveClass } from '@testing-library/jest-dom/dist/matchers';
import { Router } from "react-router-dom";
import DataFilesToolbar, { ToolbarButton } from "./DataFilesToolbar";
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
expect.extend({ toHaveClass });
describe("ToolbarButton", () => {
  const store = mockStore({})
  it("render button with correct text", () => {
    const { getByText, getByRole, getByTestId } = renderComponent(
      <ToolbarButton
        text="Rename"
        iconName="rename"
        onClick={() => {}}
      />,
      store,
      createMemoryHistory()
    );

    expect(getByText(/Rename/)).toBeDefined();
    expect(getByRole('button')).toBeDefined();
    expect(getByTestId('button-icon')).toHaveClass('icon-action icon-rename');
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
