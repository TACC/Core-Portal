import React from 'react';
import configureStore from 'redux-mock-store';
import renderComponent from 'utils/testing';
import systemsFixture from '../../DataFiles/fixtures/DataFiles.systems.fixture'
import filesFixture from '../fixtures/DataFiles.files.fixture';
import {projectsFixture} from '../../../redux/sagas/fixtures/projects.fixture';
import DataFilesProjectFileListing from './DataFilesProjectFileListing';

// Mock ResizeObserver
const {ResizeObserver} = window;

beforeEach(() => {
  delete window.ResizeObserver;
  window.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
});

afterEach(() => {
  window.ResizeObserver = ResizeObserver;
  jest.restoreAllMocks();
});

// Mock Resize Detector
jest.mock('react-resize-detector', () => ({
  useResizeDetector: () => 
  {
    return {
      height: 10,
      ref: {
        current: {
          scrollHeight: 50
        }
      }
    }
  }
}));

const mockStore = configureStore();
const initialMockState = {
  projects: projectsFixture,
  files: filesFixture,
  systems: systemsFixture,
  pushKeys: {
    modals: filesFixture.modals,
    modalProps: filesFixture.modalProps
  }
};

describe('DataFilesProjectFileListing', () => {
  it('', () => {
    const store = mockStore(initialMockState);
    const {getByText} = renderComponent(
      <DataFilesProjectFileListing system="test.site.project.PROJECT-3" path="/" />,
      store
    );

    expect(getByText(/Read More/)).toBeDefined();
  });
});
