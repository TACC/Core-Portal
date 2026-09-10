import React from 'react';
import configureStore from 'redux-mock-store';
import '@testing-library/jest-dom/extend-expect';
import renderComponent from 'utils/testing';
import UserNewsDashboard from './UserNewsDashboard';
import { waitForElementToBeRemoved } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@tacc/test-fixtures';

const mockStore = configureStore();

describe('UserNewsDashboard', () => {
  const store = mockStore({});

  it('renders a loading spinner', async () => {
    const { getByTestId, queryByTestId } = renderComponent(
      <UserNewsDashboard />,
      store
    );

    expect(getByTestId(/loading-spinner/)).toBeDefined();
    await waitForElementToBeRemoved(() => queryByTestId(/loading-spinner/));
  });

  it('renders a link when news items are loaded in', async () => {
    const { findByRole } = renderComponent(<UserNewsDashboard />, store);

    const link = await findByRole('link', {
      name: 'TACC Resource Login and Job Submissions',
    });
    expect(link.getAttribute('href')).toBe('/user-news/107637');
  });

  it('renders an error message', async () => {
    server.use(
      http.get('/api/news', () =>
        HttpResponse.json({ message: 'Failed to load news' }, { status: 500 })
      )
    );
    const { findByText } = renderComponent(<UserNewsDashboard />, store);

    await findByText(/An error has occurred/);
  });
});
