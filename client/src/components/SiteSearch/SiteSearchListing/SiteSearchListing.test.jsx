import React from 'react';
import { createMemoryHistory } from 'history';
import SiteSearchListing from './SiteSearchListing';
import configureStore from 'redux-mock-store';
import renderComponent from 'utils/testing';
import siteSearchResults from '../fixtures/siteSearch.fixture.json';
import systemsFixture from '../../DataFiles/fixtures/DataFiles.systems.fixture';
import '@testing-library/jest-dom';

const mockStore = configureStore();
const mockState = {
  systems: systemsFixture,
  files: {
    modals: {
      preview: false,
    },
    modalProps: {
      preview: {},
    },
    preview: {},
  },
  workbench: {
    config: {
      trashPath: '.Trash',
    },
  },
};

describe('SiteSearchListing', () => {
  it('renders cms content', () => {
    const history = createMemoryHistory();
    history.push('/search/cms/?page=1&query_string=test');
    const store = mockStore(mockState);
    const { getAllByRole, getByText, getAllByTestId, queryByTestId } =
      renderComponent(
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
    expect(queryByTestId('select')).toBeNull();
  });

  it('renders file listing', () => {
    const history = createMemoryHistory();
    history.push('/search/cms/?page=1&query_string=test');
    const store = mockStore(mockState);
    const { getAllByRole, getByText, getByTestId } = renderComponent(
      <SiteSearchListing
        filter="public"
        loading={false}
        error={null}
        results={siteSearchResults.public}
      />,
      store,
      history
    );

    expect(getByText(/Test data/)).toBeDefined();
    expect(getByTestId('selector')).toBeDefined();
  });

  it('renders loading spinner', () => {
    const history = createMemoryHistory();
    history.push('/search/cms/?page=1&query_string=test');
    const store = mockStore(mockState);
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
    const store = mockStore(mockState);
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
    const store = mockStore(mockState);
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
