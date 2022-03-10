import React from 'react';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import SystemsList from './SystemMonitor';

const mockStore = configureStore();
const list = [
  {
    display_name: 'Frontera',
    is_operational: true,
    jobs: { running: 1, queued: 2 },
    load_percentage: 100,
  },
  {
    display_name: 'Lonestar',
    is_operational: false,
    jobs: { running: 1 },
    load_percentage: 100,
  },
  {
    display_name: 'Stampede',
    is_operational: true,
    jobs: { running: 1, queued: 2 },
    load_percentage: 100,
  },
];

function renderSystemMonitor(store) {
  return render(
    <Provider store={store}>
      <SystemsList />
    </Provider>
  );
}

describe('System Monitor Component', () => {
  it('display a no-systems message when there is no data', () => {
    const store = mockStore({ systemMonitor: { list: [], loading: false } });
    const { getByText } = renderSystemMonitor(store);
    expect(getByText('No systems being monitored')).toBeDefined();
  });
  it('renders spinner when loading ', () => {
    const store = mockStore({ systemMonitor: { list: [], loading: true } });
    const { getByTestId } = renderSystemMonitor(store);
    expect(getByTestId('loading-spinner'));
  });
  it('renders error when there is an error ', () => {
    const store = mockStore({
      systemMonitor: { list: [], loading: false, error: 'Problem' },
    });
    const { getByText } = renderSystemMonitor(store);
    expect(getByText('Unable to gather system information'));
  });
  it('should display the system name in each row', () => {
    const store = mockStore({ systemMonitor: { list, loading: false } });
    const { getByText } = renderSystemMonitor(store);
    expect(getByText('Frontera')).toBeDefined();
    expect(getByText('Lonestar')).toBeDefined();
    expect(getByText('Stampede')).toBeDefined();
  });
});
