import React from 'react';
import fetchMock from 'fetch-mock';
import configureStore from 'redux-mock-store';
import '@testing-library/jest-dom/extend-expect';
import renderComponent from 'utils/testing';
import SystemRoleSelector from '../SystemRoleSelector';
import { waitFor, screen } from '@testing-library/react';
import systemsFixture from 'components/DataFiles/fixtures/DataFiles.systems.fixture';

import fetch from 'cross-fetch';
jest.mock('cross-fetch');
const mockStore = configureStore();

describe('SystemRoleSelector', () => {
  it('Loads and displays system role', async () => {
    const fm = fetchMock
      .sandbox()
      .mock(`/api/projects/CEP-000/system-role/testuser/`, {
        status: 200,
        body: { role: 'GUEST' },
      });
    fetch.mockImplementation(fm);

    renderComponent(
      <SystemRoleSelector projectId="CEP-000" username="testuser" />,
      mockStore({
        authenticatedUser: { user: { username: 'testuser' } },
        systems: systemsFixture,
      })
    );
    expect(await screen.findByTestId('loading-spinner')).toBeDefined();
    await waitFor(async () => {
      const query = await screen.findByText(/Guest/);
      expect(query).toBeDefined();
    });
  });
});
