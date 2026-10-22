import React from 'react';
import renderComponent, { workbenchConfig } from 'utils/testing';
import configureStore from 'redux-mock-store';
import RequestAccess from './RequestAccess';
import { initialRequestAccessState as requestAccess } from '../../redux/reducers/requestAccess.reducers';

const mockStore = configureStore();

describe('RequestAccess', () => {
  it('renders portal name within the module', () => {
    const store = mockStore({
      requestAccess,
    });

    const { getByText } = renderComponent(<RequestAccess />, store, undefined, {
      ...workbenchConfig,
      portalName: 'Test Portal',
    });
    expect(getByText(/Request Access to the Test Portal/)).toBeInTheDocument();
  });
});
