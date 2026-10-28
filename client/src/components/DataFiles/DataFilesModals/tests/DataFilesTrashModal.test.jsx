import React from 'react';
import { createMemoryHistory } from 'history';
import DataFilesTrashModal from '../DataFilesTrashModal';
import configureStore from 'redux-mock-store';
import DataFilesTrashModalFixture from './DataFilesTrashModal.fixture';
import systemsFixture from '../../fixtures/DataFiles.systems.fixture';
import renderComponent from 'utils/testing';
const mockStore = configureStore();

const initialMockState = {
  ...DataFilesTrashModalFixture,
  systems: systemsFixture,
  pushKeys: {
    modalProps: {
      pushKeys: false,
    },
  },
};
describe('DataFilesTrashModal', () => {
  it('renders the trash modal', () => {
    const history = createMemoryHistory();
    history.push('/workbench/data/tapis/private/test.system/');
    const store = mockStore(initialMockState);

    const { getAllByText } = renderComponent(
      <DataFilesTrashModal />,
      store,
      history
    );

    // Check the modal title
    expect(getAllByText(/Move to Trash/)).toBeDefined();

    // Check the description
    expect(getAllByText(/Moving 3 Files to Trash/)).toBeDefined();

    // Check for the filename to be present
    expect(getAllByText(/test.txt/)).toBeDefined();

    // Check for the list of selected files to contain
    // the size of the file to be copied
    expect(getAllByText(/4.0 kB/)).toBeDefined();

    // Check for the modal to have a Move to Trash button
    expect(getAllByText(/Move to Trash/)).toBeDefined();
  });
});
