import React from 'react';
import { createMemoryHistory } from 'history';
import SiteSearchSidebar from './SiteSearchSidebar';
import configureStore from 'redux-mock-store';
import renderComponent from 'utils/testing';
import siteSearchResults from '../fixtures/siteSearch.fixture.json';
import '@testing-library/jest-dom';
import { fireEvent } from '@testing-library/react';
import { within } from '@testing-library/dom';

const mockStore = configureStore();

describe('SiteSearchSidebar', () => {
  it('renders nav links and pills', () => {
    const history = createMemoryHistory();
    history.push('/search/cms/?page=1&query_string=test');
    const store = mockStore({});
    const { getAllByRole, getByText } = renderComponent(
      <SiteSearchSidebar
        authenticated
        schemes={['public', 'community']}
        results={siteSearchResults}
      />,
      store,
      history
    );

    expect(getAllByRole('link').length).toEqual(3);
    const webContentLink = getByText('Web Content');
    const publicFilesLink = getByText('Public Files');
    const communityDataLink = getByText('Community Data');

    // Check content of pills with result count
    expect(webContentLink.nextSibling.firstChild).toHaveTextContent('208');
    expect(publicFilesLink.nextSibling.firstChild).toHaveTextContent('3');
    expect(communityDataLink.nextSibling.firstChild).toHaveTextContent('0');
  });

  it('links navigate to correct filters', () => {
    const history = createMemoryHistory();
    history.push('/search/cms/?page=1&query_string=test');
    const store = mockStore({});
    const { getAllByRole, getByText } = renderComponent(
      <SiteSearchSidebar
        authenticated
        schemes={['public', 'community']}
        results={siteSearchResults}
      />,
      store,
      history
    );
    fireEvent.click(getByText('Public Files'));
    expect(history.location.pathname).toEqual('/search/public/');
    expect(history.location.search).toEqual('?page=1&query_string=test');

    fireEvent.click(getByText('Community Data'));
    expect(history.location.pathname).toEqual('/search/community/');
    expect(history.location.search).toEqual('?page=1&query_string=test');

    fireEvent.click(getByText('Web Content'));
    expect(history.location.pathname).toEqual('/search/cms/');
    expect(history.location.search).toEqual('?page=1&query_string=test');
  });
});
