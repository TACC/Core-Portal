import React from 'react';
import configureStore from 'redux-mock-store';
import { initialState as profile } from '../../../redux/reducers/profile.reducers';
import { initialState as notifications } from '../../../redux/reducers/notifications.reducers';
import introMessageComponents from '../../../redux/reducers/portalMessages.reducers';
import ManageAccountPage from '../index';
import renderComponent from 'utils/testing';

const mockStore = configureStore();

describe('Manage Account Page', () => {
  test('Layout of Manage Account', () => {
    const { getByText, getAllByText, getByRole } = renderComponent(
      <ManageAccountPage />,
      mockStore({
        profile,
        notifications,
        introMessageComponents,
      })
    );

    expect(getByText(/Manage Account/)).toBeInTheDocument();
    expect(getByText(/Back to Dashboard/)).toBeInTheDocument();
    expect(getAllByText(/Loading.../)).toBeDefined();
  });
});
