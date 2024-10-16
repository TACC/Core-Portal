import React from 'react';
import { createMemoryHistory } from 'history';
import DataFilesSystemSelector from './DataFilesSystemSelector';
import configureStore from 'redux-mock-store';
import systemsFixture from '../fixtures/DataFiles.systems.fixture';
import renderComponent from 'utils/testing';
import filesModalFixture from '../fixtures/files.modal.fixture';

const mockStore = configureStore();

describe('DataFilesSystemSelector', () => {
  it('does not render excluded systems in selector', () => {
    const history = createMemoryHistory();
    const store = mockStore({
      systems: systemsFixture,
      files: filesModalFixture,
    });
    const canMakePublic = true;
    const { queryByText } = renderComponent(
      <DataFilesSystemSelector
        section="modal"
        operation="copy"
        excludedSystems={systemsFixture.storage.configuration
          .filter(
            (s) =>
              s.hidden || (s.scheme !== 'private' && s.scheme !== 'projects')
          )
          .filter((s) => !(s.scheme === 'public' && canMakePublic))
          .map((s) => `${s.system}${s.homeDir || ''}`)}
      />,
      store,
      history
    );
    expect(queryByText(/My Data \(Work\)/)).toBeDefined();
    expect(queryByText(/My Data \(Frontera\)/)).toBeDefined();
    expect(queryByText(/My Data \(Longhorn\)/)).toBeDefined();
    expect(queryByText(/Google Drive/)).toBeDefined();
    expect(queryByText(/Shared Workspaces/)).toBeDefined();
    expect(queryByText(/Public Data/)).toBeDefined();
    expect(queryByText(/Community Data/)).toBeNull();
  });
});
