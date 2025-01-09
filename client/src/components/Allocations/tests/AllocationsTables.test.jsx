import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createMemoryHistory } from 'history';
import configureStore from 'redux-mock-store';
import { AllocationsTable } from '../AllocationsTables';

const mockInitialState = {
  active: [],
  inactive: [],
  loading: true,
  teams: {},
  pages: {},
  userDirectory: {},
  loadingUsernames: true,
  hosts: {},
  portal_alloc: '',
  loadingPage: false,
  errors: {},
};
const mockStore = configureStore();
describe('Allocations Table', () => {
  let getByText, rerender, debug;
  beforeEach(() => {
    const utils = render(
      <Provider
        store={mockStore({
          allocations: mockInitialState,
        })}
      >
        <MemoryRouter initialEntries={['/workbench/allocations']}>
          <AllocationsTable page="approved" />
        </MemoryRouter>
      </Provider>
    );
    getByText = utils.getByText;
    rerender = utils.rerender;
    debug = utils.debug;
  });

  it('should have relevant columns for data for the Allocations Table', () => {
    expect(getByText(/Title/)).toBeDefined();
    expect(getByText(/PI/));
    expect(getByText(/Team/)).toBeDefined();
    expect(getByText(/Systems/)).toBeDefined();
    expect(getByText(/Awarded/)).toBeDefined();
    expect(getByText(/Remaining/)).toBeDefined();
    expect(getByText(/Expires/)).toBeDefined();
  });

  it('should display an error', async () => {
    const storeWithError = mockStore({
      allocations: {
        ...mockInitialState,
        errors: { listing: new Error('PC Load Letter') },
      },
    });
    rerender(
      <Provider store={storeWithError}>
        <MemoryRouter initialEntries={['/workbench/allocations']}>
          <AllocationsTable page="approved" />
        </MemoryRouter>
      </Provider>
    );
    expect(getByText(/Unable to retrieve your allocations./)).toBeDefined();
    const reloadLink = getByText(/Try reloading the page./);
    fireEvent.click(reloadLink);
    await waitFor(() => {
      const [reload] = storeWithError.getActions();
      expect(reload.type).toBe('GET_ALLOCATIONS');
    });
  });
});
