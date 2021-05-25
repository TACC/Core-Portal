import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import Routes from './History';
import { initialState as notifications } from '../../redux/reducers/notifications.reducers';
import { initialState as jobs } from '../../redux/reducers/jobs.reducers';

const mockStore = configureStore();

describe('History Routes', () => {
  it('should render content for the history routes', () => {
    const { container } = render(
      <Provider store={mockStore({ notifications, jobs })}>
        <BrowserRouter>
          <Routes />
        </BrowserRouter>
      </Provider>
    );
    expect(container.children.length).toBeGreaterThan(0);
  });
});
