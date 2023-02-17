import React from 'react';
import { render } from '@testing-library/react';
import Jobs from './Jobs';
import { default as jobsList } from './Jobs.fixture';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import '@testing-library/jest-dom/extend-expect';
import { BrowserRouter } from 'react-router-dom';
import { initialState as notifications } from '../../redux/reducers/notifications.reducers';
import { initialState as workbench } from '../../redux/reducers/workbench.reducers';
import { initialState as jobs } from '../../redux/reducers/jobs.reducers';

const mockStore = configureStore();
const initialMockState = {
  list: jobsList,
  loading: false,
};

// Provide mock state for AppIcon
const appIconMockState = {
  appIcons: {},
};

function renderJobsComponent(store) {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <Jobs />
      </BrowserRouter>
    </Provider>
  );
}

describe('Jobs View', () => {
  it('should dispatch the get jobs event', () => {
    const store = mockStore({
      notifications,
      jobs: { ...jobs, list: jobsList },
      workbench: { ...workbench, config: { hideDataFiles: false } },
      apps: {
        appIcons: {},
      },
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Jobs />
        </BrowserRouter>
      </Provider>
    );

    expect(store.getActions()).toEqual([
      { type: 'GET_JOBS', params: { offset: 0, queryString: '' } },
    ]);
  });

  it('renders jobs', () => {
    const store = mockStore({
      jobs: {
        ...initialMockState,
      },
      apps: {
        ...appIconMockState,
      },
      notifications,
      workbench: {
        ...workbench,
        config: { hideDataFiles: false },
      },
    });

    const { getByText } = renderJobsComponent(store);
    expect(getByText(/test-job-name-1/)).toBeDefined();
    expect(getByText('05/01/2020 09:44')).toBeDefined();
  });

  it('renders errors when jobs cannot be retrieved', () => {
    const store = mockStore({
      jobs: {
        ...initialMockState,
        error: 'error',
      },
      apps: {
        ...appIconMockState,
      },
      notifications,
      workbench: {
        ...workbench,
        config: { hideDataFiles: false },
      },
    });

    const { getByText } = renderJobsComponent(store);
    expect(getByText(/unable to retrieve your jobs/)).toBeDefined();
  });
});
