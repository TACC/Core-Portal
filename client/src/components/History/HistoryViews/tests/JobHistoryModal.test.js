import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import JobHistoryModal from '../JobHistoryModal';
import jobDetailFixture from '../../../../redux/sagas/fixtures/jobdetail.fixture';
import jobDetailDisplayFixture from '../../../../redux/sagas/fixtures/jobdetaildisplay.fixture';
import appDetailFixture from '../../../../redux/sagas/fixtures/appdetail.fixture';
import { initialState as workbench } from '../../../../redux/reducers/workbench.reducers';

const mockInitialState = {
  jobId: 'job_id',
  app: appDetailFixture,
  job: jobDetailFixture,
  display: jobDetailDisplayFixture,
  loading: false,
  loadingError: false,
  loadingErrorMessage: '',
};

describe('Job History Modal', () => {
  const mockStore = configureStore();
  it('renders job history information given the job ID', () => {
    const { getByText } = render(
      <BrowserRouter>
        <Provider
          store={mockStore({
            jobDetail: {
              ...mockInitialState,
            },
            workbench: {
              ...workbench,
              config: { hideDataFiles: false },
            },
          })}
        >
          <JobHistoryModal jobId="job_id" />
        </Provider>
      </BrowserRouter>
    );
    expect(getByText(/Compress folder/)).toBeDefined();
    expect(getByText(/Target Path to be Compressed/)).toBeDefined();
    expect(getByText(/Compression Type/)).toBeDefined();
    expect(getByText(/Failure Report/)).toBeDefined();
    expect(getByText(/Max Hours/)).toBeDefined();
    expect(getByText(/Temporary Working Directory/)).toBeDefined();
  });
});
