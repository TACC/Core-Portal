import React, { Suspense } from 'react';
import {
  render,
  waitForElementToBeRemoved,
  screen,
} from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import AppRouter from './components/Workbench';
import { initialState as workbench } from './redux/reducers/workbench.reducers';
import { initialState as profile } from './redux/reducers/profile.reducers';
import { initialState as notifications } from './redux/reducers/notifications.reducers';
import { initialState as authenticatedUser } from './redux/reducers/authenticated_user.reducer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockStore = configureStore();

it('Renders index', async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <Suspense fallback="SUSPENSE FALLBACK">
      <QueryClientProvider client={queryClient}>
        <Provider
          store={mockStore({
            profile,
            workbench,
            notifications,
            authenticatedUser,
          })}
        >
          <AppRouter />
        </Provider>
      </QueryClientProvider>
    </Suspense>
  );
  await waitForElementToBeRemoved(() => screen.getByText('SUSPENSE FALLBACK'));
});
