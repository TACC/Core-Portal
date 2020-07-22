import React from 'react';
import {MemoryRouter, Route} from 'react-router-dom';
import { Provider } from "react-redux";
import { render } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { initialState as workbench } from '../../redux/reducers/workbench.reducers'
import { initialState as notifications } from '../../redux/reducers/notifications.reducers';
import Sidebar from './index';
import '@testing-library/jest-dom/extend-expect';


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
  it.each([
    'Dashboard',
    'Data Files',
    'Applications',
    'Allocations',
    'History',
  ])('should have a link to the %s page', (page) => {
    const { getByText, queryByTestId } = renderSideBar(
      mockStore({ workbench, notifications })
    );
    expect(getByText(page)).toBeDefined();
    expect(getByText(page).closest('a')).toHaveAttribute(
      'href',
      `/workbench/${page === 'Data Files' ? 'data' : page.toLowerCase()}`
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
});
