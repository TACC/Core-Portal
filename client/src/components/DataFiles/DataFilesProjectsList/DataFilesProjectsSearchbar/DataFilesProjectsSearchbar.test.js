import React from 'react';
import { fireEvent } from '@testing-library/react';
import { createMemoryHistory } from 'history';
import DataFilesProjectsSearchbar from './DataFilesProjectsSearchbar';
import configureStore from 'redux-mock-store';
import renderComponent from 'utils/testing';

const mockStore = configureStore();

describe('DataFilesProjectsSearchbar', () => {
  it('submits', () => {
    // Render the searchbar, enter a query string, and submit form
    const history = createMemoryHistory();
    history.push('/workbench/data/tapis/projects/');
    const store = mockStore({});
    const { getByRole } = renderComponent(
      <DataFilesProjectsSearchbar />,
      store,
      history
    );
    const form = getByRole('form');
    const input = getByRole('searchbox');

    fireEvent.change(input, { target: { value: 'querystring' } });
    fireEvent.submit(form);

    expect(history.location.pathname).toEqual(
      '/workbench/data/tapis/projects/'
    );
    expect(history.location.search).toEqual(`?query_string=querystring`);
  });

  it('has expected elements', () => {
    const history = createMemoryHistory();
    history.push('/workbench/data/tapis/projects/');
    const store = mockStore({});
    const { getByRole } = renderComponent(
      <DataFilesProjectsSearchbar />,
      store,
      history
    );

    expect(getByRole('form')).toBeDefined();
    expect(getByRole('searchbox')).toBeDefined();
  });
});
