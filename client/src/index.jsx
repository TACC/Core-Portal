import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
const AppRouter = React.lazy(() => import('./components/Workbench'));
import './index.css';
import store from './redux/store';

ReactDOM.render(
  <Provider store={store}>
    <Suspense fallback={<div>Lazy loading the app...</div>}>
      <AppRouter />
    </Suspense>
  </Provider>,
  document.getElementById('react-root')
);
