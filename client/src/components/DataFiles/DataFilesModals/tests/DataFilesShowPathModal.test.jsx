import React from 'react';
import { createMemoryHistory } from 'history';
import DataFilesShowPathModal from '../DataFilesShowPathModal';
import configureStore from 'redux-mock-store';
import DataFilesShowPathModalFixture from './DataFilesShowPathModal.fixture';
import systemsFixture from '../../fixtures/DataFiles.systems.fixture';
import { projectsFixture } from '../../../../redux/sagas/fixtures/projects.fixture';
import renderComponent from 'utils/testing';

const mockStore = configureStore();

const initialMockState = {
  files: DataFilesShowPathModalFixture,
  systems: systemsFixture,
  projects: projectsFixture,
};

describe('DataFilesShowPathModal', () => {
  it('renders the showpath modal', () => {
    const history = createMemoryHistory();
    history.push('/workbench/data/tapis/private/frontera.home.username/');
    const store = mockStore(initialMockState);

    const { getAllByText } = renderComponent(
      <DataFilesShowPathModal />,
      store,
      history
    );
    // Check the description
    expect(getAllByText(/testfile/)).toBeDefined();
  });

  it('renders "data.tacc" when definition.host is "cloud.data.tacc"', () => {
    const history = createMemoryHistory();
    history.push('/workbench/data/tapis/private/frontera.home.username/');

    const mockStateWithCloudHost = {
      ...initialMockState,
      systems: {
        ...initialMockState.systems,
        definitions: {
          ...initialMockState.systems.definitions,
          list: initialMockState.systems.definitions.list.map((sys) =>
            sys.id === initialMockState.files.modalProps.showpath.file.system
              ? { ...sys, host: 'cloud.data.tacc.utexas.edu' }
              : sys
          ),
        },
      },
    };

    const store = mockStore(mockStateWithCloudHost);

    const { getByText, queryByText } = renderComponent(
      <DataFilesShowPathModal />,
      store,
      history
    );

    // The raw value should never be shown
    expect(queryByText('cloud.data.tacc.utexas.edu')).toBeNull();
    // The normalized value should be shown instead
    expect(getByText('data.tacc.utexas.edu')).toBeDefined();
  });
});
