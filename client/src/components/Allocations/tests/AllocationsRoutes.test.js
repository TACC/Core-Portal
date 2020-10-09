import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import configureStore from 'redux-mock-store';

import * as ROUTES from '../../../constants/routes';
import AllocationsRoutes from '../AllocationsRoutes';

const mockStore = configureStore();
const root = ROUTES.WORKBENCH + ROUTES.ALLOCATIONS;

describe('Allocations Routes', () => {
  // RFE: Test existing routes (but do not rely on markup specifics)
  // FAQ: Specifics of resulting markup is not controlled `AllocationsRoutes`
  it('should render content for any allocations routes', () => {
    const { container } = render(
      <MemoryRouter initialEntries={[`${root}/fake`]}>
        <Provider
          store={mockStore({
            allocations: { loading: true }
          })}
        >
          <AllocationsRoutes />
        </Provider>
      </MemoryRouter>
    );
    expect(container.children.length).toBeGreaterThan(0);
  });
});
