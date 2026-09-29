import React from 'react';
import { findByText, fireEvent, screen, waitFor } from '@testing-library/react';
import renderComponent from 'utils/testing';
import configureStore from 'redux-mock-store';
import TicketCreateForm from './TicketCreateForm';
import { initialState as workbench } from '../../redux/reducers/workbench.reducers';
import { server } from '@tacc/test-fixtures';
import { http, HttpResponse } from 'msw';

const mockStore = configureStore();

const exampleAuthenticatedUser = {
  first_name: 'Max',
  username: 'mmunstermann',
  last_name: 'Munstermann',
  email: 'max@munster.mann',
  oauth: {
    expires_in: 14400,
  },
  isStaff: false,
};

async function fillOutForm(container) {
  fireEvent.change(container.querySelector('input[name="subject"]'), {
    target: { value: 'Unable to upload files' },
  });
  fireEvent.change(
    container.querySelector('textarea[name="problem_description"]'),
    {
      target: { value: 'Uploading a file fails with an unexpected error.' },
    }
  );

  const submitButton = screen.getByRole('button', { name: /add ticket/i });

  // Wait for Formik's async validation to enable submission.
  await waitFor(() => expect(submitButton).toBeEnabled());

  fireEvent.click(submitButton);
}

describe('TicketCreateForm', () => {
  it('renders form for un-authenticated users', () => {
    const store = mockStore({
      workbench,
    });

    const { getAllByText } = renderComponent(
      <TicketCreateForm provideDashBoardLinkOnSuccess={true} />,
      store
    );
    expect(getAllByText(/Explain your steps/)).toBeDefined();
  });

  it('renders form with authenticated user information', () => {
    const store = mockStore({
      workbench,
    });

    const { getAllByText, getByDisplayValue } = renderComponent(
      <TicketCreateForm
        authenticatedUser={exampleAuthenticatedUser}
        provideDashBoardLinkOnSuccess={true}
      />,
      store
    );
    expect(getByDisplayValue(/Max/)).toBeInTheDocument();
    expect(getByDisplayValue(/Munstermann/)).toBeInTheDocument();
    expect(getByDisplayValue(/max@munster.mann/)).toBeInTheDocument();
    expect(getAllByText(/Explain your steps/)).toBeDefined();
  });

  it('renders spinner when creating a ticket', async () => {
    const store = mockStore({
      workbench,
    });

    const { container } = renderComponent(
      <TicketCreateForm
        authenticatedUser={exampleAuthenticatedUser}
        provideDashBoardLinkOnSuccess={true}
      />,
      store
    );
    await fillOutForm(container);
    expect(await screen.findByTestId('loading-spinner')).toBeInTheDocument;
    expect(await screen.findByText(/1234/)).toBeInTheDocument();
  });

  it('renders a ticket create ID upon success', async () => {
    const store = mockStore({
      workbench,
    });

    const { container } = renderComponent(
      <TicketCreateForm
        authenticatedUser={exampleAuthenticatedUser}
        provideDashBoardLinkOnSuccess={true}
      />,
      store
    );
    await fillOutForm(container);
    expect(await screen.findByText(/1234/)).toBeInTheDocument();
    // Assert that fields are reset.
    expect(container.querySelector('input[name="subject"]').value).toBe('');
    expect(
      container.querySelector('textarea[name="problem_description"]').value
    ).toBe('');
  });

  it('renders a ticket creation error', async () => {
    const store = mockStore({
      workbench,
    });

    server.use(
      http.post('/api/tickets/', () => new HttpResponse(null, { status: 403 }))
    );

    const { container } = renderComponent(
      <TicketCreateForm
        authenticatedUser={exampleAuthenticatedUser}
        provideDashBoardLinkOnSuccess={true}
      />,
      store
    );

    await fillOutForm(container);

    expect(
      await screen.findByText(/There was an error creating your ticket/i)
    ).toBeInTheDocument();

    // Assert that fields are reset.
    expect(container.querySelector('input[name="subject"]').value).toBe('');
    expect(
      container.querySelector('textarea[name="problem_description"]').value
    ).toBe('');
  });
});
