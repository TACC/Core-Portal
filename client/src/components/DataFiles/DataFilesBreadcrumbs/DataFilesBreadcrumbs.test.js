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
    const history = createMemoryHistory();
    const { getByText, debug } = renderComponent(
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

    expect(getByText(/My Data \(Frontera\)/)).toBeDefined();
    expect(
      getByText(/My Data \(Frontera\)/)
        .closest('a')
        .getAttribute('href')
    ).toEqual(
      '/workbench/data/tapis/private/frontera.home.username/home/username/'
    );
    expect(getByText(/the/).closest('a').getAttribute('href')).toEqual(
      '/workbench/data/tapis/private/frontera.home.username/home/username/path/to/the/'
    );
    expect(getByText(/files/).closest('a')).toBeNull();
  });

  it('renders correct breadcrumbs when in root of system', () => {
    const store = mockStore({
      systems: systemsFixture,
    });
    const history = createMemoryHistory();
    const { getAllByText, debug } = renderComponent(
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

    expect(getAllByText('Frontera')).toBeDefined();
  });

  it('render breadcrumbs for projects', () => {
    const store = mockStore({
      systems: systemsFixture,
      projects: projectsFixture,
      files: filesFixture,
    });
    const history = createMemoryHistory();
    const { getByText, debug } = renderComponent(
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

    expect(getByText(/Shared Workspaces/)).toBeDefined();
    expect(
      getByText(/Shared Workspaces/)
        .closest('a')
        .getAttribute('href')
    ).toEqual('/workbench/data/tapis/projects/');
  });

  it('renders "View Full Path" button and is clickable', () => {
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

    const button = getByText('View Full Path');
    expect(button).toBeDefined();
    expect(button.getAttribute('disabled')).toBe(null);
  });

  it('renders "View Full Path" button as clickable for googledrive (assumes user connected their googledrive)', () => {
    const store = mockStore({
      systems: systemsFixture,
    });
    const { getByText } = renderComponent(
      <DataFilesBreadcrumbs
        api="googledrive"
        scheme="private"
        system="frontera.home.username"
        path="/"
        section="FilesListing"
      />,
      store,
      createMemoryHistory()
    );

    const button = getByText('View Full Path');
    expect(button).toBeDefined();
    expect(button.hasAttribute('disabled')).toBe(false);
  });

  it('renders "Go to ..." dropdown and can be toggled', () => {
    const store = mockStore({
      systems: systemsFixture,
    });
    const { getByText } = renderComponent(
      <DataFilesBreadcrumbs
        api="tapis"
        scheme="private"
        system="frontera.home.username"
        path="/path/to/files"
        section="FilesListing"
      />,
      store,
      createMemoryHistory()
    );

    const dropdownToggle = getByText('Go to ...');
    expect(dropdownToggle).toBeDefined();

    // Toggle dropdown
    dropdownToggle.click();

    // Now, dropdown content should be visible
    expect(getByText('Root')).toBeDefined();
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
