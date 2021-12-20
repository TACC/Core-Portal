import React from 'react';
import renderComponent from 'utils/testing';
import configureStore from 'redux-mock-store';
import RequestAccess from './RequestAccess';
import { initialRequestAccessState as requestAccess } from '../../redux/reducers/requestAccess.reducers';
import { initialState as workbench } from '../../redux/reducers/workbench.reducers';

import '@testing-library/jest-dom/extend-expect';

const mockStore = configureStore();

describe('RequestAccess', () => {
  it('renders portal name within the module', () => {
    const store = mockStore({
      requestAccess,
      workbench: {
        ...workbench,
        portalName: 'Test Portal',
      },
    });

    const { getByText } = renderComponent(<RequestAccess />, store);
    expect(getByText(/Request Access to the Test Portal/)).toBeInTheDocument();
  });
});
