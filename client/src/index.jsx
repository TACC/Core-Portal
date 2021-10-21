import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import LoadingSpinner from '_common/LoadingSpinner';
const AppRouter = React.lazy(() => import('./components/Workbench'));
import './index.css';
import store from './redux/store';

ReactDOM.render(
  <Provider store={store}>
    <Suspense fallback={<LoadingSpinner/>}>
      <AppRouter/>
    </Suspense>
  </Provider>,
  document.getElementById('react-root')
);
