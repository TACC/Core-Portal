import React from 'react';
import { createMemoryHistory } from 'history';
import DataFilesSystemSelector from './DataFilesSystemSelector';
import configureStore from 'redux-mock-store';
import systemsFixture from '../fixtures/DataFiles.systems.fixture';
import renderComponent from 'utils/testing';
import filesModalFixture from '../fixtures/files.modal.fixture';

const mockStore = configureStore();

describe('DataFilesSystemSelector', () => {
  it('contains options for non-private systems', () => {
    const history = createMemoryHistory();
    const store = mockStore({
      systems: systemsFixture,
      files: filesModalFixture,
    });
    const { queryByText } = renderComponent(
      <DataFilesSystemSelector
        section="modal"
        operation="copy"
        excludedSystems={systemsFixture.storage.configuration
          .filter((s) => s.scheme !== 'private')
          .map((s) => s.system)}
      />,
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
