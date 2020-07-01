import React from 'react';
import { MemoryRouter, Route, BrowserRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import Sidebar from './index';
import '@testing-library/jest-dom/extend-expect';
import { initialState as notifications } from '../../redux/reducers/notifications.reducers';

describe('workbench sidebar', () => {
  const mockStore = configureStore();
  it.each([
    'Dashboard',
    'Data Files',
    'Applications',
    'Allocations',
    'History',
  ])('should have a link to the %s page', (page) => {
    const { getByText, queryByTestId } = render(
      <Provider store={mockStore({ notifications })}>
        <MemoryRouter initialEntries={['/workbench']}>
          <Route path="/workbench">
            <Sidebar />
          </Route>
        </MemoryRouter>
      </Provider>
    );
    expect(getByText(page)).toBeDefined();
    expect(getByText(page).closest('a')).toHaveAttribute(
      'href',
      `/workbench/${page === 'Data Files' ? 'data' : page.toLowerCase()}`
    );
    expect(queryByTestId('history-badge')).toBeNull();
  });

  it('should have a notification badge', () => {
    const { getByTestId } = render(
      <Provider
        store={mockStore({
          notifications: { list: { unread: 1 } },
        })}
      >
        <MemoryRouter initialEntries={['/workbench']}>
          <Sidebar />
        </MemoryRouter>
      </Provider>
    );
    expect(getByTestId('history-badge')).toBeDefined();
    expect(getByTestId('history-badge')).toHaveTextContent(/1/);
  });
});
