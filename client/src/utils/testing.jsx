import React from 'react';
import {
  BrowserRouter,
  unstable_HistoryRouter as Router,
} from 'react-router-dom';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export default function renderComponent(component, store, history) {
  if (history) {
    const routerHistory = {
      ...history,
      listen: (listener) =>
        history.listen((location, action) => listener({ location, action })),
    };

    return render(
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: {
              queries: {
                retry: false,
              },
            },
          })
        }
      >
        <Provider store={store}>
          <Router history={routerHistory}>{component}</Router>
        </Provider>
      </QueryClientProvider>
    );
  }
  return render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            queries: {
              retry: false,
            },
          },
        })
      }
    >
      <Provider store={store}>
        <BrowserRouter>{component}</BrowserRouter>
      </Provider>
    </QueryClientProvider>
  );
}
