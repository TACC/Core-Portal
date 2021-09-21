import React from 'react';
import { createMemoryHistory } from "history";
import DataFilesSystemSelector from './DataFilesSystemSelector';
import configureStore from 'redux-mock-store';
import systemsFixture from '../fixtures/DataFiles.systems.fixture';
import renderComponent from 'utils/testing';


const mockStore = configureStore();

describe('DataFilesSystemSelector', () => {
  it('contains options for non-private systems', () => {
    const history = createMemoryHistory();
    const store = mockStore({ systems: systemsFixture });
    const { queryByText } = renderComponent(
      <DataFilesSystemSelector section="modal"
                excludedSystems={systemsFixture.storage.configuration
                  .filter(s => s.scheme !== 'private')
                  .map(s => s.system)}/>,
      store,
      history
    );
    expect(queryByText(/My Data \(Work\)/)).toBeDefined();
    expect(queryByText(/My Data \(Frontera\)/)).toBeDefined();
    expect(queryByText(/My Data \(Longhorn\)/)).toBeDefined();
    expect(queryByText(/Google Drive/)).toBeDefined();
    expect(queryByText(/Shared Workspaces/)).toBeDefined();
    expect(queryByText(/Public Data/)).toBeNull();
    expect(queryByText(/Community Data/)).toBeNull();
  });
});
