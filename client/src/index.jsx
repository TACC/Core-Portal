import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import LoadingSpinner from '_common/LoadingSpinner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const AppRouter = React.lazy(() => import('./components/Workbench'));
import store from './redux/store';

const queryClient = new QueryClient();

const root = createRoot(document.getElementById('react-root'));
root.render(
  <QueryClientProvider client={queryClient}>
    <Provider store={store}>
      <Suspense fallback={<LoadingSpinner />}>
        <AppRouter />
      </Suspense>
    </Provider>
  </QueryClientProvider>
);
