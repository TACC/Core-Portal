import React from 'react';
import { createMemoryHistory } from 'history';
import DataFilesCopyModal from '../DataFilesCopyModal';
import configureStore from 'redux-mock-store';
import DataFilesCopyModalFixture from './DataFilesCopyModal.fixture';
import systemsFixture from '../../fixtures/DataFiles.systems.fixture';
import renderComponent from 'utils/testing';
import { projectsFixture } from '../../../../redux/sagas/fixtures/projects.fixture';
import { fireEvent } from '@testing-library/react';
const mockStore = configureStore();

const initialMockState = {
  files: DataFilesCopyModalFixture,
  systems: systemsFixture,
  pushKeys: {
    modalProps: {
      pushKeys: false,
    },
  },
  projects: projectsFixture,
  workbench: {
    config: {
      trashPath: '.Trash',
    },
  },
  authenticatedUser: { user: null },
};

describe('DataFilesCopyModal', () => {
  it('renders the copy modal', () => {
    const history = createMemoryHistory();
    history.push('/workbench/data/tapis/private/test.system/');
    const store = mockStore(initialMockState);

    const { getAllByText } = renderComponent(
      <DataFilesCopyModal />,
      store,
      history
    );

    // Check the description
    expect(getAllByText(/Copying 1 File/)).toBeDefined();

    // Check for the filename to be present
    expect(getAllByText(/testfile/)).toBeDefined();

    // Check for the list of selected files for copying to contain
    // the size of the file to be copied
    expect(getAllByText(/4.0 kB/)).toBeDefined();

    // Check for the destination list to have a Copy button
    expect(getAllByText(/Copy/)).toBeDefined();
  });

  it('renders projects when selected', () => {
    const projectState = { ...initialMockState };
    projectState.files.modalProps.copy = { showProjects: true };
    const history = createMemoryHistory();
    history.push('/workbench/data/tapis/private/test.system/');
    const store = mockStore(projectState);

    const { getByText } = renderComponent(
      <DataFilesCopyModal />,
      store,
      history
    );
    const projectLink = getByText(/Test Project Title/);

    expect(projectLink).toBeDefined();
    expect(store.getActions()).toEqual([
      { type: 'GET_SYSTEM_MONITOR' },
      {
        payload: {
          api: 'tapis',
          default: true,
          homeDir: '/home/username',
          icon: null,
          name: 'My Data (Work)',
          path: '/home/username',
          scheme: 'private',
          section: 'modal',
          system: 'corral.home.username',
        },
        type: 'FETCH_FILES',
      },
      {
        payload: 'corral.home.username',
        type: 'FETCH_SYSTEM_DEFINITION',
      },
      {
        payload: {
          operation: 'copy',
          props: {
            showProjects: false,
          },
        },
        type: 'DATA_FILES_SET_MODAL_PROPS',
      },
      {
        type: 'PROJECTS_GET_LISTING',
        payload: { queryString: null, modal: 'copy' },
      },
    ]);
    fireEvent.click(projectLink);

    expect(store.getActions()).toEqual([
      { type: 'GET_SYSTEM_MONITOR' },
      {
        payload: {
          api: 'tapis',
          default: true,
          homeDir: '/home/username',
          icon: null,
          name: 'My Data (Work)',
          path: '/home/username',
          scheme: 'private',
          section: 'modal',
          system: 'corral.home.username',
        },
        type: 'FETCH_FILES',
      },
      {
        payload: 'corral.home.username',
        type: 'FETCH_SYSTEM_DEFINITION',
      },
      {
        payload: {
          operation: 'copy',
          props: {
            showProjects: false,
          },
        },
        type: 'DATA_FILES_SET_MODAL_PROPS',
      },
      {
        type: 'PROJECTS_GET_LISTING',
        payload: { queryString: null, modal: 'copy' },
      },
      {
        type: 'FETCH_FILES',
        payload: {
          api: 'tapis',
          scheme: 'projects',
          system: 'test.site.project.PROJECT-3',
          path: '',
          section: 'modal',
        },
      },
      {
        type: 'DATA_FILES_SET_MODAL_PROPS',
        payload: {
          operation: 'copy',
          props: { showProjects: false },
        },
      },
    ]);
  });

  it('dispatches when returning to projects', () => {
    const history = createMemoryHistory();
    history.push('/workbench/data/tapis/private/test.system/');
    const store = mockStore(initialMockState);

    const { getByText, getByTestId } = renderComponent(
      <DataFilesCopyModal />,
      store,
      history
    );

    fireEvent.change(getByTestId('selector'), { target: { value: 'shared' } });

    expect(store.getActions()).toEqual([
      { type: 'GET_SYSTEM_MONITOR' },
      {
        payload: {
          api: 'tapis',
          default: true,
          homeDir: '/home/username',
          icon: null,
          name: 'My Data (Work)',
          path: '/home/username',
          scheme: 'private',
          section: 'modal',
          system: 'corral.home.username',
        },
        type: 'FETCH_FILES',
      },
      {
        payload: 'corral.home.username',
        type: 'FETCH_SYSTEM_DEFINITION',
      },
      {
        payload: {
          operation: 'copy',
          props: {
            showProjects: false,
          },
        },
        type: 'DATA_FILES_SET_MODAL_PROPS',
      },
      {
        type: 'PROJECTS_GET_LISTING',
        payload: { queryString: null, modal: 'copy' },
      },
      {
        type: 'DATA_FILES_SET_MODAL_PROPS',
        payload: {
          operation: 'copy',
          props: { showProjects: true },
        },
      },
    ]);
  });
});
