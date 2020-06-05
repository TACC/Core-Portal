import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
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
  loadingPage: false, errors: {}
};
const mockStore = configureStore();
describe('Allocations Table', () => {
  it("should have relevant columns for data for the Allocations Table", () => {
    const history = createMemoryHistory();
    const { getByText } = render(
      <Provider
        store={mockStore({
          allocations: mockInitialState
        })}
      >
        <MemoryRouter initialEntries={["/workbench/allocations"]}>
          <AllocationsTable page="approved" />
        </MemoryRouter>
      </Provider>
    );
    expect(getByText(/Title/)).toBeDefined();
    expect(getByText(/Principal Investigator/));
    expect(getByText(/Team/)).toBeDefined();
    expect(getByText(/Systems/)).toBeDefined();
    expect(getByText(/Awarded/)).toBeDefined();
    expect(getByText(/Remaining/)).toBeDefined();
    expect(getByText(/Expires/)).toBeDefined();
  });
});
