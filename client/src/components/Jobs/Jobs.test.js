import React from 'react';
import { render } from '@testing-library/react';
import Jobs from './Jobs';
import { default as jobsList } from './JobsFixture';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import '@testing-library/jest-dom/extend-expect';
import { BrowserRouter } from 'react-router-dom';

const mockStore = configureStore();
const initialMockState = {
  list: jobsList,
  loading: false
};

function renderJobsComponent(store) {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <Jobs />
      </BrowserRouter>
    </Provider>
  );
}

describe('Jobs View', () => {
  it('renders jobs', () => {
    const store = mockStore({
      jobs: {
        ...initialMockState,
      }
    });

    const { getByText } = renderJobsComponent(store);
    expect(getByText(/test-job-name-1/)).toBeDefined();
  });
});
