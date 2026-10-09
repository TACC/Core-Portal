import React, { Suspense } from 'react';
import {
  BrowserRouter,
  unstable_HistoryRouter as Router,
} from 'react-router-dom';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { workbenchJSON } from '@tacc/test-fixtures';

export const workbenchConfig = workbenchJSON.response;

export default function renderComponent(
  component,
  store,
  history,
  initialConfig,
  initialUser
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  // Set workbench data synchronously to avoid having to wait for config in each test.
  queryClient.setQueryData(
    ['workbench'],
    initialConfig ?? workbenchJSON.response
  );

  queryClient.setQueryData(
    ['users', 'authenticatedUser'],
    initialUser !== undefined // support initialUser=null
      ? initialUser
      : {
          first_name: 'Max',
          username: 'mmunstermann',
          last_name: 'Munstermann',
          email: 'max@munster.mann',
          oauth: {
            expires_in: 14400,
          },
          groups: [],
          isStaff: false,
        }
  );

  if (history) {
    const routerHistory = {
      ...history,
      listen: (listener) =>
        history.listen((location, action) => listener({ location, action })),
    };
    return {
      queryClient,
      ...render(
        <Suspense>
          <QueryClientProvider client={queryClient}>
            <Provider store={store}>
              <Router history={routerHistory}>{component}</Router>
            </Provider>
          </QueryClientProvider>
        </Suspense>
      ),
    };
  }
  return {
    queryClient,
    ...render(
      <Suspense>
        <QueryClientProvider client={queryClient}>
          <Provider store={store}>
            <BrowserRouter>{component}</BrowserRouter>
          </Provider>
        </QueryClientProvider>
      </Suspense>
    ),
  };
}
