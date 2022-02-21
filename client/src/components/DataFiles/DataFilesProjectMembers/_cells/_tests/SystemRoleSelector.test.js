import React from 'react';
import fetchMock from 'fetch-mock';
import configureStore from 'redux-mock-store';
import '@testing-library/jest-dom/extend-expect';
import renderComponent from 'utils/testing';
import SystemRoleSelector from '../SystemRoleSelector';
import { waitFor, screen, fireEvent } from '@testing-library/react';

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
      mockStore({})
    );
    expect(await screen.findByTestId('loading-spinner')).toBeDefined();

    await waitFor(async () => {
      const query = await screen.findByDisplayValue('GUEST');
      expect(query).toBeDefined();

      const selector = await screen.findByTestId('selector');
      fireEvent.change(selector, { target: { value: 'USER' } });
      expect(await screen.findByDisplayValue('USER')).toBeDefined();
      expect(await screen.findByText('Update')).toBeDefined();
    });
  });
});
