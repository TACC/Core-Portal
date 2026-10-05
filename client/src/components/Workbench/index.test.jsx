import React from 'react';
import configureStore from 'redux-mock-store';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import AppRouter from './index';

const mockStore = configureStore();

describe('AppRouter', () => {
  it('renders AppRouter and dispatches events', () => {
    const store = mockStore({
      authenticatedUser: {
        user: {
          username: 'username',
          first_name: 'User',
          last_name: 'Name',
          email: 'user@name.com',
        },
      },
      workbench: {
        config: {},
      },
    });

    render(
      <Provider store={store}>
        <AppRouter />
      </Provider>
    );
    expect(store.getActions()).toEqual([
      { type: 'FETCH_AUTHENTICATED_USER' },
      { type: 'FETCH_WORKBENCH' },
      { type: 'FETCH_SYSTEMS' },
      { type: 'FETCH_INTRO' },
      { type: 'FETCH_CUSTOM_MESSAGES' },
    ]);
  });
});
