import React from 'react';
import { createMemoryHistory } from "history";
import DataFilesSystemSelector from './DataFilesSystemSelector';
import configureStore from 'redux-mock-store';
import systemsFixture from '../fixtures/DataFiles.systems.fixture';
import renderComponent from 'utils/testing';


const mockStore = configureStore();

describe('DataFilesSystemSelector', () => {
  it('contains options for all of the systems', () => {
    const history = createMemoryHistory();
    const store = mockStore({ systems: systemsFixture });
    const { getByText } = renderComponent(
      <DataFilesSystemSelector section="modal"/>,
      store,
      history
    );
    expect(getByText(/My Data \(Frontera\)/)).toBeDefined();
    expect(getByText(/My Data \(Longhorn\)/)).toBeDefined();
  });
});
