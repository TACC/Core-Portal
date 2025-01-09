import React from 'react';
import configureStore from 'redux-mock-store';
import fetchMock from 'fetch-mock';
import renderComponent from 'utils/testing';
import systemsFixture from '../DataFiles/fixtures/DataFiles.systems.fixture';
import Submissions, { SubmissionsUpload } from './Submissions';

const mockStore = configureStore();

describe('Submissions', () => {
  it('prevent SubmissionsUpload component from rendering', () => {
    fetchMock.mock('http://localhost/submissions/check-submitter-role/', {
      is_submitter: false,
    });
    const store = mockStore({
      systems: systemsFixture,
      files: {
        operationStatus: { upload: true },
      },
    });
    const { getAllByText, queryByText } = renderComponent(
      <Submissions />,
      store
    );
    expect(getAllByText(/Data Submission/)).toBeDefined();
    expect(queryByText(/Max File Size: 2GB/)).toBeNull();
    fetchMock.restore();
  });
});

describe('SubmissionsUpload', () => {
  it('renders the submissions page and displays the max file size', () => {
    const store = mockStore({
      systems: systemsFixture,
      files: {
        operationStatus: { upload: true },
      },
    });
    const { getAllByText, queryByText } = renderComponent(
      <SubmissionsUpload />,
      store
    );
    expect(queryByText(/Max File Size: 2GB/)).toBeDefined();
  });
});
