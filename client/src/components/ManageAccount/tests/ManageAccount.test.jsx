import React from 'react';
import configureStore from 'redux-mock-store';
import { initialState as notifications } from '../../../redux/reducers/notifications.reducers';
import introMessageComponents from '../../../redux/reducers/portalMessages.reducers';
import ManageAccountPage from '../index';
import renderComponent from 'utils/testing';
import { screen } from '@testing-library/react';
import { server } from '@tacc/test-fixtures';
import {
  profileHandlerWithGoogleDrive,
  profileHandlerWithIntegrationError,
} from '@tacc/test-fixtures/handlers/profile/profileHandlers';
import { http, HttpResponse } from 'msw';

const mockStore = configureStore();

describe('Manage Account Page', () => {
  test('Layout of Manage Account', async () => {
    renderComponent(
      <ManageAccountPage />,
      mockStore({
        notifications,
        introMessageComponents,
      })
    );

    expect(screen.getByText(/Manage Account/)).toBeInTheDocument();
    expect(screen.getByText(/Back to Dashboard/)).toBeInTheDocument();
    expect(screen.getAllByText(/Loading.../)).toBeDefined();
    const profileHeader = await screen.findByText('Profile Information');
    expect(profileHeader).toBeInTheDocument();
  });

  test('Show licenses if they exist', async () => {
    renderComponent(
      <ManageAccountPage />,
      mockStore({
        notifications,
        introMessageComponents,
      })
    );
    const licensesHeader = await screen.findByText('Licenses');
    expect(licensesHeader).toBeInTheDocument();
  });

  test('Show integrations if they exist', async () => {
    server.use(profileHandlerWithGoogleDrive);
    renderComponent(
      <ManageAccountPage />,
      mockStore({
        notifications,
        introMessageComponents,
      })
    );
    const integrationsHeader = await screen.findByText('3rd Party Apps');
    expect(integrationsHeader).toBeInTheDocument();
  });

  test('Show integration error', async () => {
    server.use(profileHandlerWithIntegrationError);
    renderComponent(
      <ManageAccountPage />,
      mockStore({
        notifications,
        introMessageComponents,
      })
    );
    await screen.findByText('3rd Party Apps');
    expect(
      screen.getByText(/An error occurred setting up Google Drive/)
    ).toBeInTheDocument();
  });

  test('handle error', async () => {
    server.use(
      http.get('/accounts/api/profile/data', () =>
        HttpResponse.json({}, { status: 404 })
      )
    );
    renderComponent(
      <ManageAccountPage />,
      mockStore({
        notifications,
        introMessageComponents,
      })
    );
    const integrationsHeader = await screen.findByText(/error/);
    expect(integrationsHeader).toBeInTheDocument();
  });
});
