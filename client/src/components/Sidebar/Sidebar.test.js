import React from 'react';
import {BrowserRouter, MemoryRouter, Route} from 'react-router-dom';
import { Provider } from "react-redux";
import { render } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { initialState as workbench } from '../../redux/reducers/workbench.reducers'
import Sidebar from './index';
import '@testing-library/jest-dom/extend-expect';
import SystemsList from "../SystemMonitor/SystemMonitor";

const mockStore = configureStore();

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
  it.each([
    'Dashboard',
    'Data Files',
    'Applications',
    'Allocations',
  ])('should have a link to the %s page', page => {
    const { getByText } = renderSideBar(mockStore({workbench}));
    expect(getByText(page)).toBeDefined();
    expect(getByText(page).closest('a')).toHaveAttribute(
      'href',
      `/workbench/${page === 'Data Files' ? 'data' : page.toLowerCase()}`
    );
  });

  it('history is not available', () => {
    const { queryByText } = renderSideBar(mockStore({workbench}));
    expect(queryByText("History")).toBeNull();
  });

  it('history is available in debug mode', () => {
    const { getByText } = renderSideBar(mockStore({workbench: {status: {debug:true}}}));
    expect(getByText("History")).toBeDefined();
    expect(getByText("History").closest('a')).toHaveAttribute(
      'href',
      `/workbench/history`
    );
  });
});
