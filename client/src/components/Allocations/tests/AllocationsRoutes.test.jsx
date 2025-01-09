import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import configureStore from 'redux-mock-store';

import * as ROUTES from '../../../constants/routes';
import AllocationsRoutes from '../AllocationsRoutes';

const mockStore = configureStore();
const PATH = ROUTES.WORKBENCH + ROUTES.ALLOCATIONS;

describe('Allocations Routes', () => {
  it('should render content for the allocations routes', () => {
    const { container } = render(
      <MemoryRouter initialEntries={[`${PATH}/fake`]}>
        <Provider
          store={mockStore({
            allocations: { loading: true },
          })}
        >
          <AllocationsRoutes />
        </Provider>
      </MemoryRouter>
    );
    expect(container.children.length).toBeGreaterThan(0);
  });
});
