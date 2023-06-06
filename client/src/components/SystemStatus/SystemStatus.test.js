import React from 'react';
import { Provider } from 'react-redux';
import { render, waitFor } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { MemoryRouter } from 'react-router-dom';
import SystemStatus from './SystemStatus';

import { toHaveAttribute } from '@testing-library/jest-dom/dist/matchers';
import fetchMock from 'fetch-mock';

const mockStore = configureStore();
const list = [
  {
    display_name: 'Frontera',
    hostname: 'frontera.tacc.utexas.edu',
    is_operational: true,
    jobs: { running: 1, queued: 2 },
    load_percentage: 100,
  },
  {
    display_name: 'Lonestar',
    hostname: 'lonestar.tacc.utexas.edu',
    is_operational: false,
    jobs: { running: 1, queued: 1 },
    load_percentage: 100,
  },
  {
    display_name: 'Stampede',
    hostname: 'stampede.tacc.utexas.edu',
    is_operational: true,
    jobs: { running: 1, queued: 2 },
    load_percentage: 100,
  },
];

const queues = [
  {
    name: 'development',
    down: false,
    hidden: false,
    free: 95,
    running: 10,
    waiting: 0,
  },
  {
    name: 'large',
    down: false,
    hidden: false,
    free: 100,
    running: 10,
    waiting: 0,
  },
];

describe('System Status Page Layout', () => {
  it('displays base system status page with system monitor', () => {
    const store = mockStore({
      systemMonitor: { list, loading: false, error: false },
    });
    const { getByText, getAllByText } = render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/workbench/system-status']}>
          <SystemStatus />
        </MemoryRouter>
      </Provider>
    );

    expect(getByText('System Monitor')).toBeDefined();
    expect(getAllByText('Stampede')).toHaveLength(2);
    expect(getAllByText('Frontera')).toHaveLength(2);
    expect(getAllByText('Lonestar')).toHaveLength(2);
  });

  it('renders queue information', async () => {
    const store = mockStore({
      systemMonitor: { list, loading: false, error: false },
    });

    fetchMock.mock(
      'http://localhost/api/system-monitor/frontera.tacc.utexas.edu',
      {
        status: 200,
        body: queues,
      }
    );

    const { getByText } = render(
      <Provider store={store}>
        <MemoryRouter
          initialEntries={['/workbench/system-status/frontera.tacc.utexas.edu']}
        >
          <SystemStatus />
        </MemoryRouter>
      </Provider>
    );

    expect.extend({ toHaveAttribute });
    expect(getByText('View All Systems')).toHaveAttribute(
      'href',
      '/workbench/system-status'
    );

    await waitFor(() => {
      expect(getByText('Frontera Queues')).toBeDefined();
      expect(getByText('development')).toBeDefined();
    });

    fetchMock.restore();
  });

  it('renders error message when no queue is found', async () => {
    const store = mockStore({
      systemMonitor: { list, loading: false, error: false },
    });

    fetchMock.mock(
      'http://localhost/api/system-monitor/frontera.tacc.utexas.edu',
      {
        status: 200,
        body: [],
      }
    );

    const { getByText } = render(
      <Provider store={store}>
        <MemoryRouter
          initialEntries={['/workbench/system-status/frontera.tacc.utexas.edu']}
        >
          <SystemStatus />
        </MemoryRouter>
      </Provider>
    );

    expect.extend({ toHaveAttribute });
    expect(getByText('View All Systems')).toHaveAttribute(
      'href',
      '/workbench/system-status'
    );

    await waitFor(() => {
      expect(
        getByText('Unable to gather system queue information')
      ).toBeDefined();
    });

    fetchMock.restore();
  });
});
