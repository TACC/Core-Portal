import React from 'react';
import renderComponent from 'utils/testing';
import configureStore from 'redux-mock-store';
import RequestAccessForm from './RequestAccessForm';
import { initialRequestAccessState as requestAccess } from '../../redux/reducers/requestAccess.reducers';

const mockStore = configureStore();

describe('RequestAccessForm', () => {
  it('renders form', () => {
    const store = mockStore({
      requestAccess,
    });

    const { getByText } = renderComponent(<RequestAccessForm />, store);
    expect(getByText(/Request Access/)).toBeInTheDocument();
  });

  it('renders spinner when requesting access', () => {
    const store = mockStore({
      requestAccess: {
        ...requestAccess,
        loading: true,
      },
    });

    const { getByTestId } = renderComponent(<RequestAccessForm />, store);
    expect(getByTestId('creating-spinner'));
  });

  it('renders a creation error', () => {
    const store = mockStore({
      requestAccess: {
        ...requestAccess,
        createdTicketId: '1234',
      },
    });

    const { getByText } = renderComponent(<RequestAccessForm />, store);
    expect(getByText(/1234/)).toBeDefined();
  });
});
