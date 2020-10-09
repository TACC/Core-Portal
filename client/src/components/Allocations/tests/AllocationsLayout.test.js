import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import {
  toHaveAttribute,
  toHaveTextContent
} from '@testing-library/jest-dom/dist/matchers';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { Layout as AllocationsLayout } from '../AllocationsLayout';
import * as ROUTES from '../../../constants/routes';

const PATH = ROUTES.WORKBENCH + ROUTES.ALLOCATIONS;

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
  loadingPage: false
};
expect.extend({ toHaveAttribute, toHaveTextContent });
describe('Allocations Page Layout', () => {
  const mockStore = configureStore();
  it('renders the Allocations Page Layout (at `/approved`) with identifying components', () => {
    const { getByText, getAllByText, getByTestId } = render(
      <Provider
        store={mockStore({
          allocations: mockInitialState
        })}
      >
        <MemoryRouter initialEntries={[`${PATH}/approved`]}>
          <AllocationsLayout page="approved" />
        </MemoryRouter>
      </Provider>
    );
    // Header
    expect(getByTestId('page-name').textContent).toEqual('approved');
    expect(getByTestId('link-manage')).toHaveAttribute(
      'href',
      `${PATH}/approved/manage`
    );
    // Sidebar
    expect(getByTestId('link-text-approved').closest('a')).toHaveAttribute(
      'href',
      `${PATH}/approved`
    );
    expect(getByTestId('link-text-expired').closest('a')).toHaveAttribute(
      'href',
      `${PATH}/expired`
    );
  });
});
