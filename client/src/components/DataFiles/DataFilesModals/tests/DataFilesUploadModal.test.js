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
      upload: true
    },
    params: {
      FilesListing: {
        api: 'tapis',
        scheme: 'private',
        system: 'test.system',
        path: ''
      },
      modal: {
        api: 'tapis',
        scheme: 'private',
        system: 'test.system',
        path: ''
      }
    },
    operationStatus: {
      upload: true
    }
  },
  projects: {
    listing: {
      project: projectsListingFixture,
      loading: false,
      error: null
    }
  },
  systems: systemsFixture
};

describe('DataFilesUploadModal', () => {
  it('renders the files upload modal full size', () => {
    const store = mockStore(initialMockState);
    const { getAllByText } = renderComponent(
      <DataFilesUploadModal direction="vertical" density="default" />,
      store
    );

    // Check that the authenticated user appears as the default owner
    // for a new project
    expect(getAllByText(/Upload Files/)).toBeDefined();
  });

  it('renders the files upload modal small area', () => {
    const store = mockStore(initialMockState);
    const { getAllByText } = renderComponent(
      <DataFilesUploadModal direction="vertical" density="compact" />,
      store
    );

    // Check that the authenticated user appears as the default owner
    // for a new project
    expect(getAllByText(/Upload Files/)).toBeDefined();
  });
});
