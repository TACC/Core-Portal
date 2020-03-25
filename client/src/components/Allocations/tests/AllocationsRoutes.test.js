import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import AllocationsRoutes from '../AllocationsRoutes';

const mockStore = configureStore();

describe('Allocations Routes', () => {
  it('should render a wrapper for the allocations routes', () => {
    const { getByTestId } = render(
      <BrowserRouter>
        <Provider
          store={mockStore({
            allocations: { loading: true }
          })}
        >
          <AllocationsRoutes />
        </Provider>
      </BrowserRouter>
    );
    expect(getByTestId(/allocations-router/)).toBeDefined();
  });
});
