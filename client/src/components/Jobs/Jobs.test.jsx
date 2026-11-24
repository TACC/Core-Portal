import React from 'react';
import { fireEvent } from '@testing-library/react';
import Jobs from './Jobs';
import { createMemoryHistory } from 'history';
import { default as jobsList } from './Jobs.fixture';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { initialState as notifications } from '../../redux/reducers/notifications.reducers';
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
      apps: {
        appIcons: {},
      },
    });

    renderComponent(<Jobs />, store);

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
    });

    const history = createMemoryHistory();
    history.push('/jobs');
    const { getByText } = renderJobsComponent(store, history);
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
      apps: {
        appIcons: {},
      },
    });

    const { container } = renderComponent(<Jobs />, store);

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
