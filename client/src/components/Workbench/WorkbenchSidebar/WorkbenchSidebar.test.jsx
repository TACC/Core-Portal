import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import configureStore from 'redux-mock-store';
import { initialState as workbench } from '../../../redux/reducers/workbench.reducers';
import { initialState as notifications } from '../../../redux/reducers/notifications.reducers';
import WorkbenchSidebar from './index';
import renderComponent from 'utils/testing';

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
function renderSideBar(store, showUIPatterns, initialState) {
  const history = createMemoryHistory();
  history.push('/workbench');
  return renderComponent(
    <Routes>
      <Route
        path="/workbench/*"
        element={
          <WorkbenchSidebar showUIPatterns={showUIPatterns} loading={false} />
        }
      />
    </Routes>,

    store,
    history,
    initialState
  );
}

describe('workbench sidebar', () => {
  const mockStore = configureStore();
  it.each(PUBLIC_PAGES)('should have a link to the %s page', (page) => {
    const { getByText, queryByRole } = renderSideBar(
      mockStore({
        notifications,
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

  it.each(APP_DATA_PAGES)(
    'should not have a link to the %s page',
    async (page) => {
      const { queryByText, queryByRole } = renderSideBar(
        mockStore({
          notifications,
        }),
        false,
        {
          config: {
            hideApps: true,
            hideDataFiles: true,
            hideAllocations: true,
            hideSystemStatus: true,
          },
        }
      );

      const path = getPath(page);
      //await waitForElementToBeRemoved(() => screen.getByText(page));
      expect(queryByText(page)).not.toBeInTheDocument();
      expect(queryByRole('status')).toBeNull();
    }
  );

  it('should have a notification badge', () => {
    const { getByRole } = renderSideBar(
      mockStore({
        workbench: {
          ...workbench,
        },
        notifications: { list: { unread: 1 } },
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
        },
        notifications,
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
