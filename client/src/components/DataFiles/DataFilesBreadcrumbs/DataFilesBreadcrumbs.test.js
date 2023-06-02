import React from 'react';
import { createMemoryHistory } from 'history';
import configureStore from 'redux-mock-store';
import renderComponent from 'utils/testing';
import DataFilesBreadcrumbs from './DataFilesBreadcrumbs';
import systemsFixture from '../fixtures/DataFiles.systems.fixture';
import filesFixture from '../fixtures/DataFiles.files.fixture';
import { initialSystemState } from '../../../redux/reducers/datafiles.reducers';
import { projectsFixture } from '../../../redux/sagas/fixtures/projects.fixture';

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
    const { getByText, debug } = renderComponent(
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

    expect(getByText('Frontera')).toBeDefined();
    expect(
      getByText('Frontera')
        .closest('a')
        .getAttribute('href')
    ).toEqual(
      '/workbench/data/tapis/private/frontera.home.username/'
    );
  });

  it('render breadcrumbs with initial empty systems', () => {
    const store = mockStore({
      systems: initialSystemState,
      projects: projectsFixture,
    });
    const history = createMemoryHistory();
    const { getByText, debug } = renderComponent(
      <DataFilesBreadcrumbs
        api="tapis"
        scheme="private"
        system="frontera.home.username"
        path="/path/to/the/files"
        section="FilesListing"
      />,
      store,
      createMemoryHistory()
    );

    expect(getByText(/Frontera/)).toBeDefined();
    expect(
      getByText(/Frontera/)
        .closest('a')
        .getAttribute('href')
    ).toEqual('/workbench/data/tapis/private/frontera.home.username/');
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
});
