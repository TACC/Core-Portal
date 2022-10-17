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
    expect(getByText(/Execution Directory/)).toBeDefined();
    expect(getByText(/Input Directory/)).toBeDefined();
    expect(getByText(/Output Directory/)).toBeDefined();
  });
});
