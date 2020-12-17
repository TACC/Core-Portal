import React from 'react';
import { createMemoryHistory } from 'history';
import DataFilesShowPathModal from '../DataFilesShowPathModal';
import configureStore from 'redux-mock-store';
import DataFilesShowPathModalFixture from './DataFilesShowPathModal.fixture';
import systemsFixture from '../../fixtures/DataFiles.systems.fixture';
import renderComponent from 'utils/testing';

const mockStore = configureStore();

const initialMockState = {
  files: DataFilesShowPathModalFixture,
  systems: systemsFixture,
};

describe('DataFilesShowPathModal', () => {
  it('renders the showpath modal', () => {
    const history = createMemoryHistory();
    history.push('/workbench/data/tapis/private/test.system/');
    const store = mockStore(initialMockState);

    const { getAllByText } = renderComponent(
      <DataFilesShowPathModal />,
      store,
      history
    );
    // Check the description
    expect(
      getAllByText(/testfile/)
    ).toBeDefined();
  });
});
