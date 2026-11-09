import React from 'react';
import { default as jobsList } from '../../../Jobs/Jobs.fixture';
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
});
