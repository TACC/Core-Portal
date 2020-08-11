import React from 'react';
import { Provider } from 'react-redux';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { render } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import DataFiles from '../DataFiles';
import systemsFixture from '../fixtures/DataFiles.systems.fixture'
import filesFixture from '../fixtures/DataFiles.files.fixture';

const mockStore = configureStore();

function renderComponent(component, store, history) {
  return render(
    <Provider store={store}>
      <Router history={history}>{component}</Router>
    </Provider>
  );
}

describe('DataFiles', () => {
  it('should render Data Files with multiple private systems', () => {
    const history = createMemoryHistory();
    const store = mockStore({
      systems: systemsFixture,
      files: filesFixture,
      pushKeys: {
        modals: {
          pushKeys: false
        },
        modalProps: {
          pushKeys: {}
        }
      }
    });
    const { getByText, getAllByText } = renderComponent(
      <DataFiles />,
      store,
      history
    )
    expect(history.location.pathname).toEqual(
      '/workbench/data/tapis/private/frontera.home.username/'
    );
    expect(getAllByText(/My Data \(Frontera\)/)).toBeDefined();
    expect(getByText(/My Data \(Longhorn\)/)).toBeDefined();
  });
});
