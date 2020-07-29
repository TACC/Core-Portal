import React from 'react';
import { Router, Route } from 'react-router-dom';
import { render } from '@testing-library/react';
import { createMemoryHistory } from "history";
import DataFilesSystemSelector from './DataFilesSystemSelector';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import systemsFixture from '../fixtures/systems.fixture';

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
    const store = mockStore({ systems: systemsFixture });
    const { getByText, debug } = renderComponent(
      <DataFilesSystemSelector section="modal"/>,
      store,
      history
    );
    expect(getByText(/My Data/)).toBeDefined();
    expect(getByText(/Community Data/)).toBeDefined();
    expect(getByText(/Public Data/)).toBeDefined();
  });
});
