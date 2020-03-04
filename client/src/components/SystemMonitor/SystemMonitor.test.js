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
    jobs: { running: 1 },
    load_percentage: 100
  },
  {
    display_name: 'Lonestar',
    is_operational: false,
    jobs: { running: 1 },
    load_percentage: 100
  },
  {
    display_name: 'Stampede',
    is_operational: true,
    jobs: { running: 1 },
    load_percentage: 100
  }
];

describe('System Monitor Component', () => {
  it('display a placeholder without data', () => {
    const { getByText } = render(
      <Provider
        store={mockStore({
          systemMonitor: {
            list: [],
            loading: false
          }
        })}
      >
        <SystemsList />
      </Provider>
    );
    expect(getByText('No rows found')).toBeDefined();
  });
  it('should display the system name in each row', () => {
    const { getByText } = render(
      <Provider
        store={mockStore({
          systemMonitor: {
            loading: false,
            list
          }
        })}
      >
        <SystemsList />
      </Provider>
    );
    expect(getByText('Frontera')).toBeDefined();
    expect(getByText('Lonestar')).toBeDefined();
    expect(getByText('Stampede')).toBeDefined();
  });
});
