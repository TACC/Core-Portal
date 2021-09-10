import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import '@testing-library/jest-dom/extend-expect';
import { initialState as profile } from '../../../redux/reducers/profile.reducers';
import { initialState as workbench } from '../../../redux/reducers/workbench.reducers';
import { initialState as notifications } from '../../../redux/reducers/notifications.reducers';
import { initialTicketCreateState as ticketCreate } from '../../../redux/reducers/tickets.reducers';
import welcomeMessages from '../../../redux/reducers/welcome.reducers';
import ManageAccountPage from '../index';

const mockStore = configureStore();

describe('Manage Account Page', () => {
  test("Layout of Manage Account", () => {
    const { getByText, getAllByText, getByRole } = render(
      <Provider store={mockStore({
        profile,
        workbench: {
          ...workbench, config: {hideDataFiles: false}
        },
        notifications,
        welcomeMessages,
        ticketCreate
      })}>
        <BrowserRouter>
          <ManageAccountPage />
        </BrowserRouter>
      </Provider>
    );

    expect(getByText(/Manage Account/)).toBeInTheDocument();
    expect(getByText(/Back to Dashboard/)).toBeInTheDocument();
    expect(getAllByText(/Loading.../)).toBeDefined();
    expect(getByRole('alert', {class: /welcomeMessageGeneral/i})).toBeInTheDocument();
  });
});
