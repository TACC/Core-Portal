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
  describe('Search form', () => {
    it('has accurate pre-submit elements', () => {
      const { getByRole } = render(
        <DataFilesSearchbar
          api="test-api"
          scheme="test-scheme"
          system="test-system"
        />
      );
      const form = getByRole('form');
      const input = getByRole('searchbox');
      const status = getByRole('status');

      expect(form).toBeDefined();
      expect(input).toBeDefined();
      expect(status.textContent).toEqual('');
    });
    it('has accurate post-submit elements', () => {
      const history = createMemoryHistory();
      history.push('/workbench/data/api/scheme/system/path');
      const store = mockStore({});
      const { getByRole, getByDisplayValue, getByText } = renderComponent(
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
      const status = getByRole('status');
      let resultCount = 0;
      let statusMessage = '';

      fireEvent.change(input, { target: { value: mockQueryString } });
      fireEvent.submit(form);

      // ???: How to define AFTER form submit?
      resultCount = 100;
      statusMessage = createMessage({ count: resultCount, query: mockQueryString });

      // ???: How to check AFTER form submit?
      expect(input.value).toEqual(mockQueryString);
      expect(status.textContent).toEqual(statusMessage);
    });
    it('has accurate post-reset elements', () => {
      const history = createMemoryHistory();
      history.push('/workbench/data/api/scheme/system/path');
      const store = mockStore({});
      const { getByRole, getByTestId } = renderComponent(
        <DataFilesSearchbar
          api="test-api"
          scheme="test-scheme"
          system="test-system"
        />,
        store,
        history
      );
      const input = getByRole('searchbox');
      const status = getByRole('status');
      const reset = getByTestId('reset');

      fireEvent.change(input, { target: { value: mockQueryString } });
      fireEvent.click(reset);

      // ???: How to check AFTER form reset?
      expect(input.value).toEqual('');
      expect(status.textContent).toEqual('');
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
});
