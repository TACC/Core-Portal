import React from 'react';
import configureStore from 'redux-mock-store';
import renderComponent from 'utils/testing';
import { projectsListingFixture } from '../../../../redux/sagas/fixtures/projects.fixture';
import systemsFixture from '../../fixtures/DataFiles.systems.fixture';
import DataFilesUploadModal from '../DataFilesUploadModal';

const mockStore = configureStore();
const initialMockState = {
  files: {
    modals: {
      upload: true,
    },
    params: {
      FilesListing: {
        api: 'tapis',
        scheme: 'private',
        system: 'test.system',
        path: '',
      },
      modal: {
        api: 'tapis',
        scheme: 'private',
        system: 'test.system',
        path: '',
      },
    },
    operationStatus: {
      upload: true,
    },
  },
  projects: {
    listing: {
      project: projectsListingFixture,
      loading: false,
      error: null,
    },
  },
  systems: systemsFixture,
};

describe('DataFilesUploadModal', () => {
  it('renders the files upload modal default layout', () => {
    const store = mockStore(initialMockState);
    const { getAllByText } = renderComponent(
      <DataFilesUploadModal layout="default" />,
      store
    );

    expect(getAllByText(/Upload Files/)).toBeDefined();
  });

  it('renders the files upload modal compact layout', () => {
    const store = mockStore(initialMockState);
    const { getAllByText } = renderComponent(
      <DataFilesUploadModal layout="compact" />,
      store
    );

    expect(getAllByText(/Upload Files/)).toBeDefined();
  });
});
