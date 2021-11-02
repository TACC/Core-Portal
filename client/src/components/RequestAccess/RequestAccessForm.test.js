import React from 'react';
import renderComponent from 'utils/testing';
import configureStore from 'redux-mock-store';
import RequestAccessForm from './RequestAccessForm';
import { initialRequestAccessState as requestAccess } from '../../redux/reducers/requestAccess.reducers';
import { initialState as workbench } from '../../redux/reducers/workbench.reducers';

import '@testing-library/jest-dom/extend-expect';

const mockStore = configureStore();

describe('FeedbackForm', () => {
  it('renders form', () => {
    const store = mockStore({
      requestAccess,
      workbench
    });

    const { getByText } = renderComponent(<RequestAccessForm />, store);
    expect(getByText(/Request Access/)).toBeInTheDocument();
  });

  it('renders spinner when creating a feedback', () => {
    const store = mockStore({
      requestAccess: {
        ...requestAccess,
        creating: true
      },
      workbench
    });

    const { getByTestId } = renderComponent(<RequestAccessForm />, store);
    expect(getByTestId('creating-spinner'));
  });
});
