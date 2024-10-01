import React from 'react';
import { createMemoryHistory } from 'history';
import SiteSearchPaginator from './SiteSearchPaginator';
import configureStore from 'redux-mock-store';
import renderComponent from 'utils/testing';
import '@testing-library/jest-dom';

const mockStore = configureStore();

describe('SiteSearchPaginator', () => {
  it('has expected elements on page 1', () => {
    const history = createMemoryHistory();
    history.push('/search/cms/?page=1&query_string=test');
    const store = mockStore({});
    const { getAllByRole } = renderComponent(
      <SiteSearchPaginator lastPageIndex={100} />,
      store,
      history
    );

    expect(getAllByRole('listitem').length).toEqual(8);
    expect(getAllByRole('listitem')[0]).toHaveClass('disabled');
  });

  it('has expected elements on last page', () => {
    const history = createMemoryHistory();
    history.push('/search/cms/?page=100&query_string=test');
    const store = mockStore({});
    const { getAllByRole } = renderComponent(
      <SiteSearchPaginator lastPageIndex={100} />,
      store,
      history
    );

    expect(getAllByRole('listitem').length).toEqual(8);
    expect(getAllByRole('listitem')[7]).toHaveClass('disabled');
  });
});
