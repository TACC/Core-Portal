import React from 'react';
import { createMemoryHistory } from 'history';
import configureStore from 'redux-mock-store';
import renderComponent from 'utils/testing';
import DataFilesBreadcrumbs from './DataFilesBreadcrumbs';
import systemsFixture from '../fixtures/DataFiles.systems.fixture';
import filesFixture from '../fixtures/DataFiles.files.fixture';
import { initialSystemState } from '../../../redux/reducers/datafiles.reducers';
import { projectsFixture } from '../../../redux/sagas/fixtures/projects.fixture';
import { fireEvent } from '@testing-library/react';

const mockStore = configureStore();

describe('DataFilesBreadcrumbs', () => {
  it('render breadcrumbs', () => {
    const store = mockStore({
      systems: systemsFixture,
      projects: projectsFixture,
    });
    const { getByText } = renderComponent(
      <DataFilesBreadcrumbs
        api="tapis"
        scheme="private"
        system="frontera.home.username"
        path="/home/username/path/to/the/files"
        section="FilesListing"
      />,
      store,
      createMemoryHistory()
    );

    // Check if the last part of the path is rendered as text
    const filesText = getByText('files');
    expect(filesText).toBeDefined();
    expect(filesText.closest('a')).toBeNull();
  });

  it('renders correct breadcrumbs when in root of system', () => {
    const store = mockStore({
      systems: systemsFixture,
    });
    const { getByText } = renderComponent(
      <DataFilesBreadcrumbs
        api="tapis"
        scheme="private"
        system="frontera.home.username"
        path="/"
        section="FilesListing"
      />,
      store,
      createMemoryHistory()
    );

    // Check if the system name is rendered as text when in the root of the system
    expect(getByText('Frontera')).toBeDefined();
  });

  it('render breadcrumbs for projects', () => {
    const store = mockStore({
      systems: systemsFixture,
      projects: projectsFixture,
      files: filesFixture,
    });
    const { getByText } = renderComponent(
      <DataFilesBreadcrumbs
        api="tapis"
        scheme="projects"
        system="frontera.home.username"
        path="/path/to/the/files"
        section="FilesListing"
      />,
      store,
      createMemoryHistory()
    );

    // Check if the last part of the path is rendered as text for projects
    const filesText = getByText('files');
    expect(filesText).toBeDefined();
    expect(filesText.closest('a')).toBeNull();
  });

  it('dispatches action to open full path modal on button click', () => {
    const store = mockStore({
      systems: systemsFixture,
      projects: projectsFixture,
    });
    const { getByText } = renderComponent(
      <DataFilesBreadcrumbs
        api="tapis"
        scheme="private"
        system="frontera.home.username"
        path="/home/username/path/to/the/files"
        section="FilesListing"
      />,
      store,
      createMemoryHistory()
    );
    const viewFullPathButton = getByText('View Full Path');
    fireEvent.click(viewFullPathButton);

    const actions = store.getActions();
    const expectedActions = {
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: {
        operation: 'showpath',
        props: {
          file: {
            system: 'frontera.home.username',
            path: '/home/username/path/to/the/files',
          },
        },
      },
    };
    expect(actions).toContainEqual(expectedActions);
  });

  it('renders pathComp, which is current directory', () => {
    const store = mockStore({
      systems: systemsFixture,
    });
    const history = createMemoryHistory();
    const { getByText } = renderComponent(
      <DataFilesBreadcrumbs
        api="tapis"
        scheme="private"
        system="frontera.home.username"
        path="/home/username/path/to/the/files"
        section="FilesListing"
      />,
      store,
      createMemoryHistory()
    );
    const pathComp = getByText('files');
    expect(pathComp).toBeDefined();
  });
});
