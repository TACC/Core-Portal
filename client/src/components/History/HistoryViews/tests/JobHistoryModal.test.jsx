import React from 'react';
import { default as jobsList } from '../../../Jobs/Jobs.fixture';
// TODOv3: dropV2Jobs
import { default as jobsV2List } from '../../../Jobs/JobsV2.fixture';
import configureStore from 'redux-mock-store';
import JobHistoryModal from '../JobHistoryModal';
import jobDetailFixture from '../../../../redux/sagas/fixtures/jobdetail.fixture';
import jobDetailDisplayFixture from '../../../../redux/sagas/fixtures/jobdetaildisplay.fixture';
import appDetailFixture from '../../../../redux/sagas/fixtures/appdetail.fixture';
import renderComponent from 'utils/testing';

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
  const testStore = mockStore({
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
  });
  it('renders job history information given the job UUID', () => {
    const { getByText } = renderComponent(
      <JobHistoryModal uuid="793e9e90-53c3-4168-a26b-17230e2e4156-007" />,
      testStore
    );
    expect(getByText(/Greeting/)).toBeDefined();
    expect(getByText(/Target/)).toBeDefined();
    expect(getByText(/Last Status Message/)).toBeDefined();
    expect(getByText(/Max Minutes/)).toBeDefined();
    expect(getByText(/Reservation/)).toBeDefined();
  });

  // TODOv3: dropV2Jobs
  it('renders v2 job history information given the job UUID', () => {
    const mockStore = configureStore();
    const testStore = mockStore({
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
    });
    const { getByText, queryByText } = renderComponent(
      <JobHistoryModal
        uuid="3b03cb52-3951-4b05-8833-27af89b937e9-007"
        // TODOv3: dropV2Jobs
        version="v2"
      />,
      testStore
    );
    expect(getByText(/filenames/)).toBeDefined();
    expect(getByText(/zipFileName/)).toBeDefined();
    expect(queryByText(/Last Status Message/)).toBeNull();
    expect(getByText(/Max Hours/)).toBeDefined();
    expect(getByText(/inputFiles/)).toBeDefined();
    expect(getByText(/Output Location/)).toBeDefined();
  });
});
