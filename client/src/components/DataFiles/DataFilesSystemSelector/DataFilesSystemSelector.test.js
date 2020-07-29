import React from 'react';
import { Router, Route } from 'react-router-dom';
import { render } from '@testing-library/react';
import { createMemoryHistory } from "history";
import DataFilesSystemSelector from './DataFilesSystemSelector';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';

const mockSystemsState = {
  systemsList: [
    {
        'name': 'My Data',
        'system': 'frontera.home.username',
        'scheme': 'private',
        'api': 'tapis',
    },
    {
        'name': 'Community Data',
        'system': 'frontera.home.community',
        'scheme': 'community',
        'api': 'tapis'
    },
    {
        'name': 'Public Data',
        'system': 'frontera.home.public',
        'scheme': 'public',
        'api': 'tapis'
    }
  ]
}



function renderComponent(component, store, history) {
  return render(
    <Provider store={store}>
      <Router history={history}>{component}</Router>
    </Provider>
  );
}

const mockStore = configureStore();

describe('DataFilesSystemSelector', () => {
  it('contains options for all of the systems', () => {
    const history = createMemoryHistory();
    const store = mockStore({ systems: mockSystemsState});
    const { getByText, debug } = renderComponent(
      <Route path="/workbench/data">
        <DataFilesSystemSelector />
      </Route>,
      store,
      history
    );

    expect(getByText(/My Data/)).toBeDefined();
  });
});
