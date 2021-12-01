import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, fireEvent, wait } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createMemoryHistory } from 'history';
import configureStore from 'redux-mock-store';
import AllocationsManageTeamModal, {AllocationsManageTeamTable } from '../AllocationsModals/AllocationsManageTeamModal/AllocationsManageTeamModal';

const mockInitialState = {
  allocations: {
    active: [],
    inactive: [],
    loading: false,
    teams: {
      1234: []
    },
    loadingUsernames: {
      1234: false
    },
    hosts: {},
    portal_alloc: '',
    loadingPage: false,
    errors: {},
    search: {
      results: [],
      term: ''
    },
    removingUserOperation: {
      userName: '',
      error: false,
      loading: false
    }
  }
}

const mockStore = configureStore();
describe('Allocations Team Management Modal', () => {
  it('should render the modal and table columns', () => {
    const { getByText, debug } = render(
      <Provider store={mockStore(mockInitialState)}>
        <MemoryRouter initialEntries={['/workbench/allocations']}>
          <AllocationsManageTeamModal isOpen toggle={()=>{}} projectId="1234" />
        </MemoryRouter>
      </Provider>
    );
      debug();
    expect(getByText(/Manage Team/)).toBeDefined();
    expect(getByText(/Members/)).toBeDefined();
    expect(getByText(/Role/)).toBeDefined();
  });
});
