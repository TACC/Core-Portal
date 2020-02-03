import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import {
  toHaveAttribute,
  toHaveTextContent
} from '@testing-library/jest-dom/dist/matchers';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { Layout as AllocationsLayout } from '../AllocationsLayout';

expect.extend({ toHaveAttribute, toHaveTextContent });
describe('Allocations Page Layout', () => {
  const mockStore = configureStore();
  it('renders the Allocations Page Layout with identifying components', () => {
    const { getByText, getAllByText, getByTestId } = render(
      <Provider
        store={mockStore({
          allocations: {
            loading: false
          }
        })}
      >
        <BrowserRouter>
          <AllocationsLayout filter="Pending" />
        </BrowserRouter>
      </Provider>
    );
    // Header
    expect(getByText(/Allocations/)).toBeDefined();
    expect(getByText(/Request New/)).toBeDefined();
    // Sidebar
    expect(getByText(/Approved/).closest('a')).toHaveAttribute(
      'href',
      '/workbench/allocations/approved'
    );
    expect(getAllByText(/Pending/)[1].closest('a')).toHaveAttribute(
      'href',
      '/workbench/allocations/pending'
    );
    expect(getByText(/Expired/).closest('a')).toHaveAttribute(
      'href',
      '/workbench/allocations/expired'
    );
    expect(getByTestId(/pending-view/)).toHaveTextContent('');
  });
});
