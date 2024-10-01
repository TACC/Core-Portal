import React from 'react';
import renderComponent from 'utils/testing';
import configureStore from 'redux-mock-store';
import { createMemoryHistory } from 'history';
import Workbench from './Workbench';
import { initialState as onboarding } from '../../redux/reducers/onboarding.reducers';
import { initialState as workbench } from '../../redux/reducers/workbench.reducers';
import { initialState as notifications } from '../../redux/reducers/notifications.reducers';
import { initialState as jobs } from '../../redux/reducers/jobs.reducers';
// TODOv3: dropV2Jobs
import { initialStateV2 as jobsv2 } from '../../redux/reducers/jobs.reducers';
import {
  initialTicketList as ticketList,
  initialTicketCreateState as ticketCreate,
  initialTicketCreateModalState as ticketCreateModal,
} from '../../redux/reducers/tickets.reducers';
import { initialState as authenticatedUser } from '../../redux/reducers/authenticated_user.reducer';
import { initialState as systemMonitor } from '../../redux/reducers/systemMonitor.reducers';
import { initialIntroMessageComponents as introMessageComponents } from '../../redux/reducers/portalMessages.reducers';
import { initialSystemState as systems } from '../../redux/reducers/datafiles.reducers';

/* state required to render workbench/dashboard */
const state = {
  authenticatedUser,
  workbench,
  onboarding,
  notifications,
  introMessageComponents,
  jobs,
  // TODOv3: dropV2Jobs
  jobsv2,
  systemMonitor,
  ticketList,
  systems,
  ticketCreate,
  ticketCreateModal,
};

describe('workbench', () => {
  const mockStore = configureStore();
  it('renders workbench for onboarding)', () => {
    const history = createMemoryHistory();
    const store = mockStore({
      ...state,
      workbench: {
        ...workbench,
        setupComplete: false,
        loading: false,
      },
    });
    const { getByText } = renderComponent(<Workbench />, store, history);
    expect(
      getByText(
        /The following steps must be completed before accessing the portal/
      )
    ).toBeDefined();
  });
  it('renders workbench for user who has already completed onboarding)', () => {
    const history = createMemoryHistory();
    const store = mockStore({
      ...state,
      workbench: {
        ...workbench,
        setupComplete: true,
        loading: false,
      },
    });

    const { getByText } = renderComponent(<Workbench />, store, history);
    expect(getByText(/My Recent Jobs/)).toBeDefined();
    expect(getByText(/My Tickets/)).toBeDefined();
  });
  it('shows loading spinner if systems request not finished', () => {
    const history = createMemoryHistory();
    const store = mockStore({
      ...state,
      systems: {
        ...systems,
        storage: {
          ...systems.storage,
          loading: true,
        },
      },
    });
    const { getByTestId } = renderComponent(<Workbench />, store, history);
    expect(getByTestId(/loading-spinner/)).toBeDefined();
  });
});
