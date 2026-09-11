import React from 'react';
import configureStore from 'redux-mock-store';
import renderComponent from 'utils/testing';
import * as ROUTES from '../../constants/routes';
import UserNewsBrowse from './UserNewsBrowse';
import {
  findByText,
  getByText,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@tacc/test-fixtures';

const mockStore = configureStore();

describe('UserNewsBrowse', () => {
  const store = mockStore({});

  it('renders a loading spinner', async () => {
    const { getByTestId, queryByTestId } = renderComponent(
      <UserNewsBrowse />,
      store
    );

    expect(getByTestId(/loading-spinner/)).toBeInTheDocument();
    await waitForElementToBeRemoved(() => queryByTestId(/loading-spinner/));
  });

  it('renders an error message when request fails', async () => {
    server.use(
      http.get('/api/news', () =>
        HttpResponse.json({ message: 'Failed to load news' }, { status: 500 })
      )
    );

    const { findByText } = renderComponent(<UserNewsBrowse />, store);
    expect(
      await findByText(/Unable to load user updates/i)
    ).toBeInTheDocument();
  });

  it('renders heading, date label, and clickable title link', async () => {
    const { findByText, getByRole, getByText, queryByTestId } = renderComponent(
      <UserNewsBrowse />,
      store
    );
    await findByText(/User Updates/i);
    expect(
      getByRole('link', {
        name: /TACC Resource Login and Job Submissions/,
      })
    ).toHaveAttribute('href', '/user-news/107637');
    expect(getByText(/Updated/)).toBeInTheDocument();
  });

  it('renders empty state when no updates are available', async () => {
    server.use(
      http.get('/api/news', () => HttpResponse.json({ response: [] }))
    );

    const { findByText } = renderComponent(<UserNewsBrowse />, store);
    expect(await findByText(/No recent updates found/i)).toBeInTheDocument();
  });
});
