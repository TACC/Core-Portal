import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { createMemoryHistory } from 'history';
import configureStore from 'redux-mock-store';
import renderComponent from 'utils/testing';
import DataFilesSearchbar from './DataFilesSearchbar';
import systemsFixture from '../fixtures/DataFiles.systems.fixture';

const mockStore = configureStore();

describe('DataFilesSearchbar', () => {
  it('submits', () => {
    // Render the searchbar, enter a query string, and submit form
    const history = createMemoryHistory();
    history.push('/workbench/data/test-api/test-scheme/test-system/');
    const store = mockStore({
      systems: systemsFixture,
      files: {
        error: {},
        loading: {}
      }
    });
    const { getByRole } = renderComponent(
      <DataFilesSearchbar
        api="test-api"
        scheme="test-scheme"
        system="test-system"
      />,
      store,
      history
    );
    const form = getByRole('form');
    const input = getByRole('searchbox');

    fireEvent.change(input, { target: { value: 'querystring' } });
    fireEvent.submit(form);

    expect(history.location.pathname).toEqual(
      '/workbench/data/test-api/test-scheme/test-system/'
    );
    expect(history.location.search).toEqual(`?query_string=querystring`);
  });

  it('changes route on dropdown select', () => {
    const history = createMemoryHistory();
    history.push('/workbench/data/test-api/test-scheme/test-system/');
    const store = mockStore({
      systems: systemsFixture,
      files: {
        error: {},
        loading: {}
      }
    });
    const { getByTestId } = renderComponent(
      <DataFilesSearchbar
        api="test-api"
        scheme="test-scheme"
        system="test-system"
      />,
      store,
      history
    );
    const dropdownSelector = getByTestId('selector');
    fireEvent.change(dropdownSelector, { target: { value: 'Images' } });
    expect(history.location.search).toEqual(`?filter=Images`);
  });

  it('clears field on route change', async () => {
    // Render the searchbar with a query string in the URL, then navigate away.
    const history = createMemoryHistory();
    history.push(
      '/workbench/data/api/scheme/system/path/?query_string=testquery'
    );
    const store = mockStore({
      systems: systemsFixture,
      files: {
        error: {},
        loading: {}
      }
    });
    const { getByRole, getByText, queryByText, debug } = renderComponent(
      <DataFilesSearchbar
        api="test-api"
        scheme="test-scheme"
        system="test-system"
      />,
      store,
      history
    );
    let input = getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'testquery' } });
    expect(input.value).toBe('testquery');

    await waitFor(() => history.push('/workbench/data/api/scheme/system2/path/'));

    input = getByRole('searchbox');
    expect(input.value).toBe('');
  });

  it('has expected elements', () => {
    const history = createMemoryHistory();
    history.push(
      '/workbench/data/api/scheme/system/path?query_string=testquery'
    );
    const store = mockStore({
      systems: systemsFixture,
      files: {
        error: {},
        loading: {}
      }
    });
    const { getByRole, getByTestId, getByPlaceholderText } = renderComponent(
      <DataFilesSearchbar
        api="tapis"
        scheme="private"
        system="frontera.home.username"
        resultCount={4}
      />,
      store,
      history
    );

    expect(getByRole('form')).toBeDefined();
    expect(getByRole('searchbox')).toBeDefined();
    expect(getByTestId('selector')).toBeDefined();
    expect(getByPlaceholderText('Search My Data (Frontera)')).toBeDefined();
  });
});
