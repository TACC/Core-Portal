import React from 'react';
import configureStore from 'redux-mock-store';
import renderComponent from 'utils/testing';
import systemsFixture from '../DataFiles/fixtures/DataFiles.systems.fixture';
import Submissions from './Submissions';

const mockStore = configureStore();

describe('Submissions', () => {
  it('renders the submissions page and displays the max file size', () => {
    const store = mockStore({
      systems: systemsFixture,
      files: {
        operationStatus: { upload: true },
      },
    });
    const { getAllByText } = renderComponent(<Submissions />, store);
    expect(getAllByText(/Data Submission/)).toBeDefined();
    expect(getAllByText(/Max File Size: 2GB/)).toBeDefined();
  });
});
