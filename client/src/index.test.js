import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import AppRouter from './components/Workbench';
import { initialState as workbench } from './redux/reducers/workbench.reducers';
import { initialState as profile } from './redux/reducers/profile.reducers';
import { initialState as notifications } from './redux/reducers/notifications.reducers';
import { initialTicketCreateState as ticketCreate } from './redux/reducers/tickets.reducers';
import { initialState as authenticatedUser } from './redux/reducers/authenticated_user.reducer';

const mockStore = configureStore();

it('Renders index', () => {
  render(
    <Provider
      store={mockStore({
        profile,
        workbench,
        notifications,
        ticketCreate,
        authenticatedUser,
      })}
    >
      <Router>
        <AppRouter />
      </Router>
    </Provider>
  );
});
