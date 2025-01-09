import React from 'react';
import configureStore from 'redux-mock-store';
import { createMemoryHistory } from 'history';
import renderComponent from 'utils/testing';
import GoogleDrivePrivacyPolicy from './GoogleDrivePrivacyPolicy';

const mockStore = configureStore();
describe('ToolbarButton', () => {
  const store = mockStore({});
  it('renders Google Drive Policy', () => {
    const { getByText } = renderComponent(
      <GoogleDrivePrivacyPolicy />,
      store,
      createMemoryHistory()
    );

    expect(getByText(/Google Drive Privacy Policy/)).toBeDefined();
  });
});
