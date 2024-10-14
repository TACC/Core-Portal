import React from 'react';
import { createMemoryHistory } from 'history';
import { SiteSearchComponent } from './SiteSearch';
import configureStore from 'redux-mock-store';
import renderComponent from 'utils/testing';
import siteSearchResults from './fixtures/siteSearch.fixture.json';
import systemsFixture from '../DataFiles/fixtures/DataFiles.systems.fixture';
import '@testing-library/jest-dom';

const mockStore = configureStore();
const mockState = {
  systems: systemsFixture,
  siteSearch: {
    loading: false,
    error: null,
    completed: true,
    results: siteSearchResults,
  },
  authenticatedUser: { user: null },
  files: {
    modals: {
      preview: false,
    },
    modalProps: {
      preview: {},
    },
    preview: {},
  },
};

describe('SiteSearchComponent', () => {
  it('dispatches action and redirects to filter', () => {
    const history = createMemoryHistory({
      initialEntries: ['/search'],
    });
    history.push('/search/?page=1&query_string=test');
    const store = mockStore(mockState);
    const { getAllByRole, getByText, getAllByTestId } = renderComponent(
      <SiteSearchComponent filterPriorityList={['cms']} />,
      store,
      history
    );

    expect(store.getActions()).toEqual([
      {
        type: 'FETCH_SITE_SEARCH',
        payload: { page: '1', query_string: 'test' },
      },
    ]);

    expect(history.location.pathname).toEqual('/search/cms/');
  });
});
