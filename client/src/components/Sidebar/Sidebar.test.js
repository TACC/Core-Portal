import React from 'react';
import { MemoryRouter, Route } from 'react-router-dom';
import { Provider } from "react-redux";
import { render } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { initialState as workbench } from '../../redux/reducers/workbench.reducers'
import { initialState as notifications } from '../../redux/reducers/notifications.reducers';
import Sidebar from './index';
import '@testing-library/jest-dom/extend-expect';


const PUBLIC_PAGES = [
  'Dashboard',
  'Data Files',
  'Applications',
  'Allocations',
  'History'
];
const DEBUG_PAGES = [
  'UI Patterns',
];

function getPath(page) {
  let path;
  switch (page) {
    case 'Data Files':
      path = 'data'
      break;
    default:
      path = page.toLowerCase().replace(' ', '-');
      break;
  }
  return path;
}
function renderSideBar(store) {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/workbench']}>
        <Route path='/workbench'>
          <Sidebar />
        </Route>
      </MemoryRouter>
    </Provider>
  );
}

describe('workbench sidebar', () => {
  const mockStore = configureStore();
  it.each(PUBLIC_PAGES)('should have a link to the %s page', page => {
    const { getByText, queryByTestId } = renderSideBar(
      mockStore({ workbench, notifications })
    );
    const path = getPath(page);
    expect(getByText(page)).toBeDefined();
    expect(getByText(page).closest('a')).toHaveAttribute(
      'href',
      `/workbench/${path}`
    );
    expect(queryByTestId('history-badge')).toBeNull();
  });

  it('should have a notification badge', () => {
    const { getByTestId } = renderSideBar(
      mockStore({
        workbench,
        notifications: { list: { unread: 1 } },
      })
    );

    expect(getByTestId('history-badge')).toBeDefined();
    expect(getByTestId('history-badge')).toHaveTextContent(/1/);
  });

  it.each(DEBUG_PAGES)('is not available', page => {
    const { queryByText } = renderSideBar(
      mockStore({ workbench, notifications })
    );
    expect(queryByText(page)).toBeNull();
  });

  it.each(DEBUG_PAGES)('is available in debug mode', page => {
    const { getByText } = renderSideBar(
      mockStore({ workbench: { status: { debug: true } }, notifications })
    );
    const path = getPath(page);
    expect(getByText(page)).toBeDefined();
    expect(getByText(page).closest('a')).toHaveAttribute(
      'href',
      `/workbench/${path}`
    );
  });
});
