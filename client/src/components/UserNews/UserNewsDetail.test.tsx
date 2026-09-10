import React from 'react';
import configureStore from 'redux-mock-store';
import { createMemoryHistory } from 'history';
import '@testing-library/jest-dom/extend-expect';
import renderComponent from 'utils/testing';
import UserNewsDetail from './UserNewsDetail';
import { waitForElementToBeRemoved } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@tacc/test-fixtures';
import { Route } from 'react-router-dom';

const mockStore = configureStore();

describe('UserNewsDetail', () => {
  const store = mockStore({});

  it('renders a loading spinner', async () => {
    const history = createMemoryHistory({
      initialEntries: ['/user-news/107637'],
    });
    const { getByTestId, queryByTestId } = renderComponent(
      <Route path="/user-news/:id">
        <UserNewsDetail />
      </Route>,
      store,
      history
    );

    expect(getByTestId(/loading-spinner/)).toBeDefined();
    await waitForElementToBeRemoved(() => queryByTestId(/loading-spinner/));
  });

  it('renders not found state with back link', async () => {
    const history = createMemoryHistory({
      initialEntries: ['/user-news/9999'],
    });
    const { findByText } = renderComponent(
      <Route path="/user-news/:id">
        <UserNewsDetail />
      </Route>,
      store,
      history
    );

    await findByText(/Update not found/i);
  });

  it('renders an error message when request fails', async () => {
    server.use(
      http.get('/api/news', () =>
        HttpResponse.json({ message: 'Failed to load news' }, { status: 500 })
      )
    );

    const history = createMemoryHistory({
      initialEntries: ['/user-news/107637'],
    });

    const { findByText } = renderComponent(
      <Route path="/user-news/:id">
        <UserNewsDetail />
      </Route>,
      store,
      history
    );
    await findByText(/Unable to load user updates/i);
  });

  it('renders selected detail timeline and passes sanitize false', async () => {
    const history = createMemoryHistory({
      initialEntries: ['/user-news/107637'],
    });
    const { getByText, queryByTestId, findByText } = renderComponent(
      <Route path="/user-news/:id">
        <UserNewsDetail />
      </Route>,
      store,
      history
    );
    await waitForElementToBeRemoved(() => queryByTestId(/loading-spinner/));
    await findByText(/TACC Resource Login and Job Submissions/);
    expect(getByText(/Updated/)).toBeTruthy();
    expect(getByText(/Original Message/)).toBeTruthy();
  });
});
