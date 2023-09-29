import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import Jobs from './Jobs';
import { createMemoryHistory } from 'history';
import { default as jobsList } from './Jobs.fixture';
// TODOv3: dropV2Jobs
import { default as jobsV2List } from './JobsV2.fixture';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import '@testing-library/jest-dom/extend-expect';
import { BrowserRouter } from 'react-router-dom';
import { initialState as notifications } from '../../redux/reducers/notifications.reducers';
import { initialState as workbench } from '../../redux/reducers/workbench.reducers';
import renderComponent from 'utils/testing';
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

function renderJobsComponent(store, history) {
  return renderComponent(<Jobs />, store, history);
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
      // TODOv3: dropV2Jobs
      jobsv2: {
        list: jobsV2List,
        loading: false,
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

    const history = createMemoryHistory();
    history.push('/jobs');
    const { getByText } = renderJobsComponent(store, history);
    expect(getByText(/test-job-name-1/)).toBeDefined();
    expect(getByText('05/01/2020 09:44')).toBeDefined();
  });

  // TODOv3: dropV2Jobs
  it('renders jobs v2', () => {
    const store = mockStore({
      jobs: {
        ...initialMockState,
      },
      // TODOv3: dropV2Jobs
      jobsv2: {
        list: jobsV2List,
        loading: false,
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

    const history = createMemoryHistory();

    // TODOv3: dropV2Jobs
    history.push('/jobsv2');
    const { getAllByText } = renderJobsComponent(store, history);
    expect(getAllByText('Compressing Files')).toBeDefined();
    expect(getAllByText('12/12/2022 14:52')).toBeDefined();
  });

  it('renders errors when jobs cannot be retrieved', () => {
    const store = mockStore({
      jobs: {
        ...initialMockState,
        error: 'error',
      },
      // TODOv3: dropV2Jobs
      jobsv2: {
        list: jobsV2List,
        loading: false,
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
    const history = createMemoryHistory();
    history.push('/jobs');
    const { getByText } = renderJobsComponent(store, history);
    expect(getByText(/unable to retrieve your jobs/)).toBeDefined();
  });

  it('should dispatch another get jobs event on scroll with proper offset', async () => {
    const store = mockStore({
      notifications,
      jobs: { ...jobs, list: jobsList },
      workbench: { ...workbench, config: { hideDataFiles: false } },
      apps: {
        appIcons: {},
      },
    });

    const { container } = render(
      <Provider store={store}>
        <BrowserRouter>
          <Jobs />
        </BrowserRouter>
      </Provider>
    );

    const scrollContainer = container.querySelector('.table-container');

    fireEvent.scroll(scrollContainer, { target: { scrollTop: 1 } });

    expect(store.getActions()).toEqual([
      { type: 'GET_JOBS', params: { offset: 0, queryString: '' } },
      {
        type: 'GET_JOBS',
        params: { offset: jobsList.length, queryString: '' },
      },
    ]);
  });
});
