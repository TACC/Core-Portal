import React from 'react';
import configureStore from 'redux-mock-store';
import { createMemoryHistory } from 'history';
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

    expect(getByTestId(/loading-spinner/)).toBeInTheDocument();
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

    expect(await findByText(/Update not found/i)).toBeInTheDocument();
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
    expect(
      await findByText(/Unable to load user updates/i)
    ).toBeInTheDocument();
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
    expect(
      await findByText(/TACC Resource Login and Job Submissions/)
    ).toBeInTheDocument();
    expect(getByText(/Updated/)).toBeInTheDocument();
    expect(getByText(/Original Message/)).toBeInTheDocument();
  });
});
