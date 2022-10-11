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
  uuid: 'ba34f946-8a18-44c4-9b25-19e21dfadf69-007',
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
          <JobHistoryModal uuid="ba34f946-8a18-44c4-9b25-19e21dfadf69-007" />
        </Provider>
      </BrowserRouter>
    );
    expect(getByText(/Compress folder/)).toBeDefined();
    expect(getByText(/Target Path to be Compressed/)).toBeDefined();
    expect(getByText(/Compression Type/)).toBeDefined();
    expect(getByText(/Failure Report/)).toBeDefined();
    expect(getByText(/Max Minutes/)).toBeDefined();
    expect(getByText(/Execution Directory/)).toBeDefined();
    expect(getByText(/Input Directory/)).toBeDefined();
    expect(getByText(/Output Directory/)).toBeDefined();
  });
});
