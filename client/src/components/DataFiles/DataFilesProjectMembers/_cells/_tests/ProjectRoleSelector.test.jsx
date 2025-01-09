import React from 'react';
import fetchMock from 'fetch-mock';
import { vi } from 'vitest';
import configureStore from 'redux-mock-store';
import '@testing-library/jest-dom/extend-expect';
import renderComponent from 'utils/testing';
import ProjectRoleSelector from '../ProjectRoleSelector';
import { waitFor, screen, fireEvent } from '@testing-library/react';

import fetch from 'cross-fetch';
vi.mock('cross-fetch');
const mockStore = configureStore();

describe('ProjectRoleSelector', () => {
  it('renders AppRouter and dispatches events', async () => {
    const fm = fetchMock
      .sandbox()
      .get(`/api/projects/CEP-000/project-role/testuser/`, {
        status: 200,
        body: { role: 'co_pi' },
      });
    fetch.mockImplementation(fm);

    renderComponent(
      <ProjectRoleSelector projectId="CEP-000" username="testuser" />,
      mockStore({})
    );
    expect(await screen.findByTestId('loading-spinner')).toBeDefined();

    await waitFor(async () => {
      expect(await screen.findByDisplayValue('Co-PI')).toBeDefined();
      const selector = await screen.findByTestId('selector');

      fireEvent.change(selector, { target: { value: 'team_member' } });
      expect(await screen.findByDisplayValue('Member')).toBeDefined();
      expect(await screen.findByText('Update')).toBeDefined();
    });
  });
});
