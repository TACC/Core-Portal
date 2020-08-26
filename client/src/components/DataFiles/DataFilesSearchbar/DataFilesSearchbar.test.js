import React from 'react';
import { fireEvent } from '@testing-library/react';
import { createMemoryHistory } from 'history';
import DataFilesSearchbar from './DataFilesSearchbar';
import systemsFixture from '../fixtures/DataFiles.systems.fixture'
import configureStore from 'redux-mock-store';
import renderComponent from 'utils/testing';

const mockStore = configureStore();

describe('DataFilesSearchbar', () => {
  it('submits', () => {
    // Render the searchbar, enter a query string, and submit form
    const history = createMemoryHistory();
    history.push('/workbench/data/api/scheme/system/path');
    const store = mockStore({systems: systemsFixture});
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
  it('has expected elements', () => {
    const history = createMemoryHistory();
    history.push('/workbench/data/api/scheme/system/path?query_string=testquery');
    const store = mockStore({systems: systemsFixture});
    const { getByRole, getByTestId, getByPlaceholderText } = renderComponent(
      <DataFilesSearchbar
        api="tapis"
        scheme="private"
        system="frontera.home.username"
      />,
      store,
      history
    );

    expect(getByRole('form')).toBeDefined();
    expect(getByRole('searchbox')).toBeDefined();
    expect(getByTestId('reset')).toBeDefined();
    expect(getByPlaceholderText('Search in My Data (Frontera)')).toBeDefined();
  });
});
