import React from 'react';
import { Route } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import configureStore from 'redux-mock-store';
import renderComponent from 'utils/testing';
import DataFilesSidebar from './DataFilesSidebar';
import systemsFixture from '../fixtures/DataFiles.systems.fixture';

const mockStore = configureStore();

const store = mockStore({
  files: {
    error: {
      FilesListing: false
    },
    params: {
      FilesListing: {}
    }
  },
  systems: systemsFixture,
  authenticatedUser: {
    user: {
      username: 'username',
      first_name: 'User',
      last_name: 'Name',
      email: 'user@username.com'
    }
  }
});

describe('DataFilesSidebar', () => {
  it('contains an Add button and a link', () => {
    const history = createMemoryHistory();
    history.push('/workbench/data/');

    const { getByText } = renderComponent(
      <Route path="/workbench/data">
        <DataFilesSidebar />
      </Route>,
      store,
      history
    );

    expect(getByText(/\+ Add/)).toBeDefined();
    expect(getByText(/My Data \(Frontera\)/)).toBeDefined();
    expect(
      getByText(/My Data \(Frontera\)/)
        .closest('a')
        .getAttribute('href')
    ).toEqual('/workbench/data/tapis/private/frontera.home.username/');
    expect(getByText(/My Data \(Longhorn\)/)).toBeDefined();
    expect(
      getByText(/My Data \(Longhorn\)/)
        .closest('a')
        .getAttribute('href')
    ).toEqual('/workbench/data/tapis/private/longhorn.home.username/');
  });
});
