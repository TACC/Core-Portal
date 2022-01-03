import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { AllocationsRequestModal, AllocationsTeamViewModal } from './index';

const mockStore = configureStore();

describe('New Allocations Request Modal', () => {
  test('Allocations Request UI', () => {
    const { getByText, getAllByText } = render(
      <BrowserRouter>
        <AllocationsRequestModal isOpen toggle={() => null} />
      </BrowserRouter>
    );
    const xrasLink = 'https://tacc-submit.xras.xsede.org/';
    expect(getByText(/Manage Allocations/)).toBeDefined();
    expect(getAllByText(/You can manage your allocation/)).toBeDefined();
    expect(getAllByText(/You can manage your allocation/)).toHaveLength(2);
    expect(getByText(xrasLink)).toBeDefined();
    expect(getByText(xrasLink).href).toBe(xrasLink);
  });
});

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({
    pathname: '/allocations/approved',
  }),
}));
describe('View Team Modal', () => {
  const testProps = {
    isOpen: true,
    toggle: () => null,
    projectId: 1234,
  };

  test('View Team Modal Loading', () => {
    const testStore = mockStore({
      allocations: {
        teams: {
          1234: [],
        },
        loadingUsernames: {
          1234: {
            loading: true,
          },
        },
        errors: {},
      },
    });
    const { getByText } = render(
      <Provider store={testStore}>
        <AllocationsTeamViewModal {...testProps} />
      </Provider>
    );

    expect(getByText(/Loading user list./)).toBeDefined();
  });

  test('View Team Modal Listing', () => {
    const testStore = mockStore({
      allocations: {
        teams: {
          1234: [
            {
              id: '123456',
              username: 'testuser1',
              role: 'Standard',
              firstName: 'Test',
              lastName: 'User1',
              email: 'user1@gmail.com',
              usageData: [],
            },
            {
              id: '012345',
              username: 'testuser2',
              role: 'Standard',
              firstName: 'Test',
              lastName: 'User2',
              email: 'user2@gmail.com',
              usageData: [
                {
                  usage: '0.5 SU',
                  resource: 'stampede2.tacc.utexas.edu',
                  allocationId: 1,
                  percentUsed: 0.005,
                  status: 'Active',
                },
                {
                  usage: '10 SU',
                  resource: 'frontera.tacc.utexas.edu',
                  allocationId: 2,
                  percentUsed: 10,
                  status: 'Active',
                },
              ],
            },
          ],
        },
        loadingUsernames: {
          1234: {
            loading: false,
          },
        },
        errors: {},
      },
    });

    // Render Modal
    const { getByText, queryByText, getByRole } = render(
      <Provider store={testStore}>
        <AllocationsTeamViewModal {...testProps} />
      </Provider>
    );

    // Check for the list of users
    expect(getByText(/View Team/)).toBeDefined();
    expect(getByText(/Test User1/)).toBeDefined();
    expect(getByText(/Test User2/)).toBeDefined();

    // View Information for the user without usage
    fireEvent.click(getByText(/Test User1/));
    expect(getByText(/Username/)).toBeDefined();
    expect(getByText(/Email/)).toBeDefined();
    expect(queryByText(/Usage/)).toBeDefined();

    // View information for the user with usage
    fireEvent.click(getByText(/Test User2/));
    expect(getByText(/Frontera/)).toBeDefined();
    expect(getByText(/Stampede 2/)).toBeDefined();
  });

  test('View Team Modal Errors', () => {
    const testStore = mockStore({
      allocations: {
        teams: {
          1234: [],
        },
        loadingUsernames: {
          1234: {
            loading: true,
          },
        },
        errors: {
          teams: { 1234: new Error('Unable to fetch') },
        },
      },
    });

    const { getByText } = render(
      <Provider store={testStore}>
        <AllocationsTeamViewModal {...testProps} />
      </Provider>
    );

    expect(getByText(/Unable to retrieve team data./)).toBeDefined();
  });
});
