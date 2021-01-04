import React from 'react';
import { fireEvent } from '@testing-library/react';
import { createMemoryHistory } from 'history';
import SiteSearchSearchbar from './SiteSearchSearchbar';
import configureStore from 'redux-mock-store';
import renderComponent from 'utils/testing';

const mockStore = configureStore();

describe('SiteSearchSearchbar', () => {
  it('submits', () => {
    // Render the searchbar, enter a query string, and submit form
    const history = createMemoryHistory();
    history.push('/search/');
    const store = mockStore({});
    const { getByRole } = renderComponent(
      <SiteSearchSearchbar />,
      store,
      history
    );
    const form = getByRole('form');
    const input = getByRole('searchbox');

    fireEvent.change(input, { target: { value: 'querystring' } });
    fireEvent.submit(form);

    expect(history.location.pathname).toEqual('/search/');
    expect(history.location.search).toEqual(`?page=1&query_string=querystring`);
  });

  it('has expected elements', () => {
    const history = createMemoryHistory();
    history.push('/search/');
    const store = mockStore({});
    const { getByRole } = renderComponent(
      <SiteSearchSearchbar />,
      store,
      history
    );

    expect(getByRole('form')).toBeDefined();
    expect(getByRole('searchbox')).toBeDefined();
  });
});
