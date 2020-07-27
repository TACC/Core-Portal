import React from 'react';
import { Router } from 'react-router-dom';
import { render, fireEvent } from '@testing-library/react';
import { createMemoryHistory } from 'history';
import DataFilesSearchbar, { createMessage } from './DataFilesSearchbar';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';

function renderComponent(component, store, history) {
  return render(
    <Provider store={store}>
      <Router history={history}>{component}</Router>
    </Provider>
  );
}

const mockStore = configureStore();
const mockQueryString = 'querystring';

describe('DataFilesSearchbar', () => {
  it('has expected elements', () => {
    const { getByRole, getByTestId } = render(
      <DataFilesSearchbar
        api="test-api"
        scheme="test-scheme"
        system="test-system"
      />
    );

    expect(getByRole('form')).toBeDefined();
    expect(getByRole('searchbox')).toBeDefined();
    expect(getByRole('status')).toBeDefined();
    expect(getByRole('combobox')).toBeDefined();
    expect(getByTestId('reset')).toBeDefined();
  });
  it('submits', () => {
    // Render the searchbar, enter a query string, and submit form
    const history = createMemoryHistory();
    history.push('/workbench/data/api/scheme/system/path');
    const store = mockStore({});
    const { getByRole, getByText } = renderComponent(
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

    fireEvent.change(input, { target: { value: mockQueryString } });
    fireEvent.submit(form);

    expect(history.location.pathname).toEqual(
      '/workbench/data/test-api/test-scheme/test-system/'
    );
    expect(history.location.search).toEqual(`?query_string=${mockQueryString}`);
  });
});
