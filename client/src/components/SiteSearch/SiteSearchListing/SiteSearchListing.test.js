import React from 'react';
import { createMemoryHistory } from 'history';
import SiteSearchListing from './SiteSearchListing';
import configureStore from 'redux-mock-store';
import renderComponent from 'utils/testing';
import siteSearchResults from '../fixtures/siteSearch.fixture.json';
import '@testing-library/jest-dom';

const mockStore = configureStore();

describe('SiteSearchListing', () => {
  it('renders cms content', () => {
    const history = createMemoryHistory();
    history.push('/search/cms/?page=1&query_string=test');
    const store = mockStore({});
    const { getAllByRole, getByText, getAllByTestId } = renderComponent(
      <SiteSearchListing
        filter="cms"
        loading={false}
        error={null}
        results={siteSearchResults.cms}
      />,
      store,
      history
    );

    expect(getAllByTestId('sitesearch-cms-item').length).toBe(2);
    expect(getByText(/Lateral Load Resisting System/)).toBeDefined();
    expect(getAllByRole('link')[0]).toHaveAttribute(
      'href',
      'https://lehigh.designsafe-ci.org/facility/test-beds'
    );
    expect(getAllByRole('link')[1]).toHaveAttribute(
      'href',
      'https://simcenter.designsafe-ci.org/about/test-page'
    );
  });

  it('renders loading spinner', () => {
    const history = createMemoryHistory();
    history.push('/search/cms/?page=1&query_string=test');
    const store = mockStore({});
    const { getByTestId } = renderComponent(
      <SiteSearchListing
        filter="cms"
        loading={true}
        error={null}
        results={siteSearchResults.cms}
      />,
      store,
      history
    );

    expect(getByTestId('loading-spinner')).toBeDefined();
  });

  it('renders warning when no results', () => {
    const history = createMemoryHistory();
    history.push('/search/cms/?page=1&query_string=test');
    const store = mockStore({});
    const { getByText } = renderComponent(
      <SiteSearchListing
        filter="cms"
        loading={false}
        error={null}
        results={{ count: 0, listing: [] }}
      />,
      store,
      history
    );

    expect(getByText(/No results found in Web Content./)).toBeDefined();
  });

  it('renders error message', () => {
    const history = createMemoryHistory();
    history.push('/search/cms/?page=1&query_string=test');
    const store = mockStore({});
    const { getByText } = renderComponent(
      <SiteSearchListing
        filter="cms"
        loading={false}
        error={{ status: 404, message: 'not found' }}
        results={{ count: 0, listing: [] }}
      />,
      store,
      history
    );

    expect(
      getByText(/There was an error retrieving your search results./)
    ).toBeDefined();
  });
});
