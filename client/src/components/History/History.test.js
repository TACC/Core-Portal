import React from 'react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import renderComponent from 'utils/testing';
import Routes from './History';
import { initialState as workbench } from '../../redux/reducers/workbench.reducers';
import { initialState as notifications } from '../../redux/reducers/notifications.reducers';
import { initialState as jobs } from '../../redux/reducers/jobs.reducers';
import jobDetailFixture from '../../redux/sagas/fixtures/jobdetail.fixture';
import jobDetailDisplayFixture from '../../redux/sagas/fixtures/jobdetaildisplay.fixture';
import appDetailFixture from '../../redux/sagas/fixtures/appdetail.fixture';

const mockStore = configureStore();

describe('History Routes', () => {
  it('should render content for the history routes', () => {
    const { container } = render(
      <Provider
        store={mockStore({
          notifications,
          jobs,
          workbench: { ...workbench, config: { hideDataFiles: false } },
        })}
      >
        <BrowserRouter>
          <Routes />
        </BrowserRouter>
      </Provider>
    );
    expect(container.children.length).toBeGreaterThan(0);
  });

  it('should dispatch the get jobs event', () => {
    const store = mockStore({
      notifications,
      jobs,
      workbench: { ...workbench, config: { hideDataFiles: false } },
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Routes />
        </BrowserRouter>
      </Provider>
    );

    expect(store.getActions()).toEqual([
      { type: 'GET_JOBS', params: { offset: 0 } },
      expect.anything(),
    ]);
  });

  it('should dispatch the get job detail event type when opening the job detail modal', () => {
    const history = createMemoryHistory();
    history.push('/workbench/history/jobs/1');

    const store = mockStore({
      notifications,
      jobs,
      jobDetail: {
        jobId: 'job_id',
        app: appDetailFixture,
        job: jobDetailFixture,
        display: jobDetailDisplayFixture,
        loading: false,
        loadingError: false,
        loadingErrorMessage: '',
      },
      workbench: { ...workbench, config: { hideDataFiles: false } },
    });

    renderComponent(
      <MemoryRouter initialEntries={['/workbench/history/jobs/1']}>
        <Routes />
      </MemoryRouter>,
      store,
      history
    );

    expect(store.getActions()).toEqual([
      {
        type: 'GET_JOB_DETAILS',
        payload: {
          jobId: '1',
        },
      },
    ]);
  });
});
