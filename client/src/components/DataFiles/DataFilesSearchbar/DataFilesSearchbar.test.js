import React from 'react';
import { Router, Route } from 'react-router-dom';
import { render, fireEvent, getByRole } from '@testing-library/react';
import { createMemoryHistory } from 'history';
import DataFilesSidebar from './DataFilesSearchbar';
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

describe('DataFilesSearchbar', () => {
  it('Search submits on click', () => {
    // Render the searchbar, enter a query string, and click the search button.
    const history = createMemoryHistory();
    history.push('/workbench/data/api/scheme/system/path');
    const store = mockStore({});
    const { getByLabelText, getByRole } = renderComponent(
      <DataFilesSidebar
        api="test-api"
        scheme="test-scheme"
        system="test-system"
      />,
      store,
      history
    );

    const input = getByLabelText('search-input');
    const button = getByRole('button');

    fireEvent.change(input, { target: { value: 'querystring' } });
    fireEvent.click(button);

    expect(history.location.pathname).toEqual(
      '/workbench/data/test-api/test-scheme/test-system/'
    );
    expect(history.location.search).toEqual('?query_string=querystring');
  });

  it('Search submits on keypress', () => {
    // Render the searchbar, enter a query string, and press 'Enter'
    const history = createMemoryHistory();
    history.push('/workbench/data/api/scheme/system/path');
    const store = mockStore({});
    const { getByLabelText } = renderComponent(
      <DataFilesSidebar
        api="test-api"
        scheme="test-scheme"
        system="test-system"
      />,
      store,
      history
    );

    const input = getByLabelText('search-input');

    fireEvent.change(input, { target: { value: 'querystring' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(history.location.pathname).toEqual(
      '/workbench/data/test-api/test-scheme/test-system/'
    );
    expect(history.location.search).toEqual('?query_string=querystring');
  });
});
