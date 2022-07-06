import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import LoadingSpinner from '_common/LoadingSpinner';
import { QueryClient, QueryClientProvider } from 'react-query';
const AppRouter = React.lazy(() => import('./components/Workbench'));
import store from './redux/store';

const queryClient = new QueryClient();

ReactDOM.render(
  <QueryClientProvider client={queryClient}>
    <Provider store={store}>
      <Suspense fallback={<LoadingSpinner />}>
        <AppRouter />
      </Suspense>
    </Provider>
  </QueryClientProvider>,
  document.getElementById('react-root')
);
