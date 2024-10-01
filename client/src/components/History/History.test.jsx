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
// TODOv3: dropV2Jobs
import { initialStateV2 as jobsv2 } from '../../redux/reducers/jobs.reducers';
import { default as jobsList } from '../Jobs/Jobs.fixture';
// TODOv3: dropV2Jobs
import { default as jobsV2List } from '../Jobs/JobsV2.fixture';
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
          jobs: { ...jobs, list: jobsList },
          // TODOv3: dropV2Jobs
          jobsv2: { ...jobsv2, list: jobsV2List },
          jobDetail: {
            jobUuid: 'job_uuid',
            app: appDetailFixture,
            job: jobDetailFixture,
            display: jobDetailDisplayFixture,
            loading: false,
            loadingError: false,
            loadingErrorMessage: '',
          },
          workbench: { ...workbench, config: { hideDataFiles: false } },
          apps: {
            appIcons: {},
          },
        })}
      >
        <BrowserRouter>
          <Routes />
        </BrowserRouter>
      </Provider>
    );
    expect(container.children.length).toBeGreaterThan(0);
  });

  it('should dispatch the get job detail event type when opening the job detail modal', () => {
    const history = createMemoryHistory();
    history.push(
      '/workbench/history/jobs/793e9e90-53c3-4168-a26b-17230e2e4156-007'
    );

    const store = mockStore({
      notifications,
      jobs: { ...jobs, list: jobsList },
      // TODOv3: dropV2Jobs
      jobsv2: { ...jobsv2, list: jobsV2List },
      jobDetail: {
        jobUuid: 'job_uuid',
        app: appDetailFixture,
        job: jobDetailFixture,
        display: jobDetailDisplayFixture,
        loading: false,
        loadingError: false,
        loadingErrorMessage: '',
      },
      apps: {
        appIcons: {},
      },
      workbench: { ...workbench, config: { hideDataFiles: false } },
    });

    renderComponent(
      <MemoryRouter
        initialEntries={[
          '/workbench/history/jobs/793e9e90-53c3-4168-a26b-17230e2e4156-007',
        ]}
      >
        <Routes />
      </MemoryRouter>,
      store,
      history
    );

    expect(store.getActions()).toEqual([
      {
        type: 'GET_JOB_DETAILS',
        payload: {
          jobUuid: '793e9e90-53c3-4168-a26b-17230e2e4156-007',
        },
      },
      { type: 'GET_JOBS', params: { offset: 0, queryString: '' } },
    ]);
  });
});
