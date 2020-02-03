import React from 'react';
import { Router, Route } from 'react-router-dom';
import { render, fireEvent } from '@testing-library/react';
import { createMemoryHistory } from 'history';
import DataFilesSidebar from './DataFilesSidebar';
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

describe('DataFilesSidebar', () => {
  it('contains an Add button and a link', () => {
    const history = createMemoryHistory();
    history.push('/workbench/data/');
    const store = mockStore({ files: { error: { FilesListing: false } } });
    const { getByText, debug } = renderComponent(
      <Route path="/workbench/data">
        <DataFilesSidebar />
      </Route>,
      store,
      history
    );

    expect(getByText(/\+ Add/)).toBeDefined();
    expect(getByText(/My Data/)).toBeDefined();
    expect(
      getByText(/My Data/)
        .closest('a')
        .getAttribute('href')
    ).toEqual('/workbench/data/tapis/private/');
  });
});
