import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import {
  toHaveAttribute,
  toHaveTextContent,
} from '@testing-library/jest-dom/dist/matchers';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { Layout as AllocationsLayout } from '../AllocationsLayout';

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
};
expect.extend({ toHaveAttribute, toHaveTextContent });
describe('Allocations Page Layout', () => {
  const mockStore = configureStore();
  it('renders the Allocations Page Layout with identifying components', () => {
    const { getByText, getAllByText } = render(
      <Provider
        store={mockStore({
          allocations: mockInitialState,
        })}
      >
        <MemoryRouter initialEntries={['/workbench/allocations/approved']}>
          <AllocationsLayout page="approved" />
        </MemoryRouter>
      </Provider>
    );
    // Header
    expect(getAllByText(/Allocations/)).toBeDefined();
    expect(getByText(/Manage/)).toBeDefined();
    // Sidebar
    expect(getAllByText(/Approved/)[1].closest('a')).toHaveAttribute(
      'href',
      '/workbench/allocations/approved'
    );
    expect(getByText(/Expired/).closest('a')).toHaveAttribute(
      'href',
      '/workbench/allocations/expired'
    );
  });
});
