import React from 'react';
import { MemoryRouter, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { initialState as workbench } from '../../../redux/reducers/workbench.reducers';
import { initialState as notifications } from '../../../redux/reducers/notifications.reducers';
import { initialTicketCreateState as ticketCreate } from '../../../redux/reducers/tickets.reducers';
import WorkbenchSidebar from './index';
import '@testing-library/jest-dom/extend-expect';

const PUBLIC_PAGES = [
  'Dashboard',
  'Data Files',
  'Applications',
  'Allocations',
  'History',
  'System Status',
];
const APP_DATA_PAGES = [
  'Applications',
  'History',
  'Data Files',
  'Allocations',
  'System Status',
];
const DEBUG_PAGES = ['UI Patterns'];

function getPath(page) {
  let path;
  switch (page) {
    case 'Data Files':
      path = 'data';
      break;
    default:
      path = page.toLowerCase().replace(' ', '-');
      break;
  }
  return path;
}
function renderSideBar(store, showUIPatterns) {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/workbench']}>
        <Route path="/workbench">
          <WorkbenchSidebar showUIPatterns={showUIPatterns} loading={false} />
        </Route>
      </MemoryRouter>
    </Provider>
  );
}

describe('workbench sidebar', () => {
  const mockStore = configureStore();
  it.each(PUBLIC_PAGES)('should have a link to the %s page', (page) => {
    const { getByText, queryByRole } = renderSideBar(
      mockStore({
        workbench: {
          ...workbench,
          config: {
            hideApps: false,
            hideDataFiles: false,
            hideAllocations: false,
            hideSystemStatus: false,
          },
        },
        notifications,
        ticketCreate,
      }),
      false
    );
    const path = getPath(page);
    expect(getByText(page)).toBeDefined();
    expect(getByText(page).closest('a')).toHaveAttribute(
      'href',
      `/workbench/${path}`
    );
    expect(queryByRole('status')).toBeNull();
  });

  it.each(APP_DATA_PAGES)('should not have a link to the %s page', (page) => {
    const { queryByText, queryByRole } = renderSideBar(
      mockStore({
        workbench: {
          ...workbench,
          config: {
            hideApps: true,
            hideDataFiles: true,
            hideAllocations: true,
            hideSystemStatus: true,
          },
        },
        notifications,
        ticketCreate,
      }),
      false
    );
    const path = getPath(page);
    expect(queryByText(page)).not.toBeInTheDocument();
    expect(queryByRole('status')).toBeNull();
  });

  it('should have a notification badge', () => {
    const { getByRole } = renderSideBar(
      mockStore({
        workbench: {
          ...workbench,
          config: { hideApps: false, hideDataFiles: false },
        },
        notifications: { list: { unread: 1 } },
        ticketCreate,
      }),
      false
    );

    expect(getByRole('status')).toBeDefined();
    expect(getByRole('status')).toHaveTextContent(/1/);
  });

  it.each(DEBUG_PAGES)('is not available', (page) => {
    const { queryByText } = renderSideBar(
      mockStore({
        workbench,
        notifications,
        ticketCreate,
      }),
      false
    );
    expect(queryByText(page)).toBeNull();
  });

  it.each(DEBUG_PAGES)('is available in debug mode', (page) => {
    const { getByText } = renderSideBar(
      mockStore({
        workbench: {
          status: { debug: true },
          config: {
            hideApps: false,
            hideDataFiles: false,
            hideAllocations: false,
          },
        },
        notifications,
        ticketCreate,
      }),
      true
    );
    const path = getPath(page);
    expect(getByText(page)).toBeDefined();
    expect(getByText(page).closest('a')).toHaveAttribute(
      'href',
      `/workbench/${path}`
    );
  });
});
