import React, { Suspense } from 'react';
import configureStore from 'redux-mock-store';
import {
  render,
  screen,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import { Provider } from 'react-redux';
import AppRouter from './index';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockStore = configureStore();

describe('AppRouter', () => {
  it('renders AppRouter and dispatches events', async () => {
    const store = mockStore({
      authenticatedUser: {
        user: {
          username: 'username',
          first_name: 'User',
          last_name: 'Name',
          email: 'user@name.com',
        },
      },
      workbench: {
        config: {},
      },
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <Suspense fallback="SUSPENSE FALLBACK">
        <QueryClientProvider client={queryClient}>
          <Provider store={store}>
            <AppRouter />
          </Provider>
        </QueryClientProvider>
      </Suspense>
    );
    await waitForElementToBeRemoved(() =>
      screen.getByText('SUSPENSE FALLBACK')
    );
    expect(store.getActions()).toEqual([
      { type: 'FETCH_SYSTEMS' },
      { type: 'FETCH_INTRO' },
      { type: 'FETCH_CUSTOM_MESSAGES' },
    ]);
  });
});
