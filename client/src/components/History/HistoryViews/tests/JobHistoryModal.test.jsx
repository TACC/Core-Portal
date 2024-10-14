import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { default as jobsList } from '../../../Jobs/Jobs.fixture';
// TODOv3: dropV2Jobs
import { default as jobsV2List } from '../../../Jobs/JobsV2.fixture';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import JobHistoryModal from '../JobHistoryModal';
import jobDetailFixture from '../../../../redux/sagas/fixtures/jobdetail.fixture';
import jobDetailDisplayFixture from '../../../../redux/sagas/fixtures/jobdetaildisplay.fixture';
import appDetailFixture from '../../../../redux/sagas/fixtures/appdetail.fixture';
import { initialState as workbench } from '../../../../redux/reducers/workbench.reducers';

const mockInitialState = {
  uuid: '793e9e90-53c3-4168-a26b-17230e2e4156-007',
  app: appDetailFixture,
  job: jobDetailFixture,
  display: jobDetailDisplayFixture,
  loading: false,
  loadingError: false,
  loadingErrorMessage: '',
};

describe('Job History Modal', () => {
  const mockStore = configureStore();
  it('renders job history information given the job UUID', () => {
    const { getByText } = render(
      <BrowserRouter>
        <Provider
          store={mockStore({
            jobDetail: {
              ...mockInitialState,
            },
            jobs: {
              list: jobsList,
            },
            // TODOv3: dropV2Jobs
            jobsv2: {
              list: jobsV2List,
            },
            workbench: {
              ...workbench,
              config: { hideDataFiles: false },
            },
          })}
        >
          <JobHistoryModal uuid="793e9e90-53c3-4168-a26b-17230e2e4156-007" />
        </Provider>
      </BrowserRouter>
    );
    expect(getByText(/Greeting/)).toBeDefined();
    expect(getByText(/Target/)).toBeDefined();
    expect(getByText(/Last Status Message/)).toBeDefined();
    expect(getByText(/Max Minutes/)).toBeDefined();
  });

  // TODOv3: dropV2Jobs
  it('renders v2 job history information given the job UUID', () => {
    const { getByText, queryByText } = render(
      <BrowserRouter>
        <Provider
          store={mockStore({
            jobDetail: {
              ...mockInitialState,
            },
            jobs: {
              list: jobsList,
            },
            // TODOv3: dropV2Jobs
            jobsv2: {
              list: jobsV2List,
            },
            workbench: {
              ...workbench,
              config: { hideDataFiles: false },
            },
          })}
        >
          <JobHistoryModal
            uuid="3b03cb52-3951-4b05-8833-27af89b937e9-007"
            // TODOv3: dropV2Jobs
            version="v2"
          />
        </Provider>
      </BrowserRouter>
    );
    expect(getByText(/filenames/)).toBeDefined();
    expect(getByText(/zipFileName/)).toBeDefined();
    expect(queryByText(/Last Status Message/)).toBeNull();
    expect(getByText(/Max Hours/)).toBeDefined();
    expect(getByText(/inputFiles/)).toBeDefined();
    expect(getByText(/Output Location/)).toBeDefined();
  });
});
