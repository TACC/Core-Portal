import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { toBeInTheDocument } from '@testing-library/jest-dom/dist/matchers';
import {
  Team,
  Systems,
  Awarded,
  Remaining,
  Expires,
} from '../AllocationsCells';
import systemAccessor from '../AllocationsUtils';

const fixture = {
  projectId: 'TEST-Project',
  systems: [
    {
      name: 'Test System',
      host: 'tacc.utexas.edu',
      type: 'HPC',
      allocation: {
        id: 57229,
        start: '2020-01-01T00:00:00Z',
        end: '2020-01-01T00:00:00Z',
        status: 'Active',
        justification: 'An allocation to test with',
        decisionSummary: 'Jest tested',
        dateRequested: '2020-01-01T00:00:00Z',
        dateReviewed: '2020-01-01T00:00:00Z',
        computeRequested: 100,
        computeAllocated: 100,
        storageRequested: 100,
        storageAllocated: 100,
        memoryRequested: 0,
        memoryAllocated: 0,
        resourceId: 52,
        resource: 'TestSystem',
        projectId: 23881,
        project: 'TEST-Project',
        requestorId: 9840,
        requestor: 'Owais Jamil',
        reviewerId: 0,
        reviewer: null,
        computeUsed: 25.57,
      },
    },
  ],
  title: 'TEST-Team',
  pi: 'Test PI',
};

const mockStore = configureStore();
const mockInitialState = {
  allocations: {
    active: [],
    inactive: [],
    loading: true,
    teams: {
      5555: [{}],
    },
    pages: {},
    userDirectory: {},
    loadingUsernames: true,
    errors: {},
    search: {
      results: {},
    },
  },
};
const Wrapper = ({ store, children }) => (
  <Provider store={store}>{children}</Provider>
);

expect.extend({ toBeInTheDocument });
describe('Allocations Table Cells', () => {
  const { systems } = fixture;
  it('should have a team view link in a cell', () => {
    const { getByText } = render(
      <Wrapper store={mockStore(mockInitialState)}>
        <Team cell={{ value: { name: 'tacc-team', projectId: 5555 } }} />
      </Wrapper>
    );
    expect(getByText(/View Team/)).toBeInTheDocument();
  });
  it('should have Systems cells', () => {
    const value = systems;
    const { getByText } = render(
      <Systems
        cell={{
          value,
        }}
      />
    );
    expect(getByText(/Test System/)).toBeInTheDocument();
  });
  it('should show Awarded allocations', () => {
    const value = systemAccessor(systems, 'Awarded');
    const { getByText } = render(<Awarded cell={{ value }} />);
    expect(getByText(/SU/)).toBeInTheDocument();
  });
  it('should show Remaining allocations', () => {
    const value = systemAccessor(systems, 'Remaining');
    const { getByText } = render(<Remaining cell={{ value }} />);
    expect(getByText(/SU/)).toBeInTheDocument();
  });
  it('should show allocation expiration date', () => {
    const values = { expires: systemAccessor(systems, 'Expires') };
    const { getByTestId } = render(<Expires row={{ values }} />);
    expect(getByTestId(/expiration-date/)).toBeDefined();
  });
});
