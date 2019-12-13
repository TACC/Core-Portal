import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import AppRouter from './components/Workbench';

const mockStore = configureStore();

it('Renders index', () => {
  render(
    <Provider store={mockStore({})}>
      <Router>
        <AppRouter />
      </Router>
    </Provider>
  );
});
