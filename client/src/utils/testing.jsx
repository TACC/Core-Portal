import React from 'react';
import { BrowserRouter, Router } from 'react-router-dom';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

export default function renderComponent(component, store, history) {
  if (history) {
    return render(
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <Router history={history}>{component}</Router>
        </Provider>
      </QueryClientProvider>
    );
  }
  return render(
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <BrowserRouter>{component}</BrowserRouter>
      </Provider>
    </QueryClientProvider>
  );
}
