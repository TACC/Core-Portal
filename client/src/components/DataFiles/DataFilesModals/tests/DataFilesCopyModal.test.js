import React from "react";
import { createMemoryHistory } from "history";
import  DataFilesCopyModal  from "../DataFilesCopyModal";
import configureStore from "redux-mock-store";
import DataFilesCopyModalFixture from './DataFilesCopyModal.fixture';
import systemsFixture from '../../fixtures/DataFiles.systems.fixture';
import renderComponent from 'utils/testing';

const mockStore = configureStore();

const initialMockState = {
  files: DataFilesCopyModalFixture,
  systems: systemsFixture
};


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

    // Check the description
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
