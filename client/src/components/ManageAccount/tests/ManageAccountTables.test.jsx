import { screen } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import {
  ProfileInformation,
  PasswordInformation,
  Integrations,
  Licenses,
} from '../ManageAccountTables';
import renderComponent from 'utils/testing';
import { server } from '@tacc/test-fixtures';
import userEvent from '@testing-library/user-event';
import {
  profileHandlerWithGoogleDrive,
  profileHandlerWithIntegration,
  profileHandlerWithLicense,
} from '@tacc/test-fixtures/handlers/profile/profileHandlers';

const mockStore = configureStore({});

describe('Profile Information Component', () => {
  const testStore = mockStore({});
  beforeEach(async () => {
    renderComponent(<ProfileInformation />, testStore);
    await screen.findByText(/^Profile Information/);
  });

  test('Show column headings and content', () => {
    expect(screen.getByText(/^Profile Information/)).toBeInTheDocument();
    const headings = [
      'Full Name',
      'Email',
      'Institution',
      'Country of Citizenship',
    ];
    headings.forEach((heading) => {
      expect(screen.getByText(heading)).toBeInTheDocument();
    });
  });
  test('should have a button to go to an external site for profile editing', async () => {
    expect(
      screen
        .getByText(/Edit Profile Information/)
        .closest('a')
        .getAttribute('href')
    ).toBe('https://accounts.tacc.utexas.edu/profile');
  });
});

describe('Change Password Component', () => {
  const testStore = mockStore({});
  beforeEach(async () => {
    renderComponent(<PasswordInformation />, testStore);
    await screen.findByText(/Password Information/);
  });

  it('should show the user the last time they changed their password', () => {
    expect(screen.getByText(/Last Changed/)).toBeInTheDocument();
    expect(screen.getByText(/6\/21\/2026/)).toBeInTheDocument();
  });

  it('should have a button for users to go to external site for password change', async () => {
    expect(
      screen
        .getByText(/Change Password/)
        .closest('a')
        .getAttribute('href')
    ).toBe('https://accounts.tacc.utexas.edu/change_password');
  });
});

describe('Third Party Apps', () => {
  it('Shows connect link when not connected', async () => {
    const testStore = mockStore({});
    renderComponent(<Integrations />, testStore);
    await screen.findByText(/3rd Party Apps/);
    expect(screen.getByText(/3rd Party Apps/)).toBeInTheDocument();
    expect(screen.getByText('Google Drive')).toBeInTheDocument();
    expect(screen.getByText('Setup Google Drive')).toBeInTheDocument();
  });
  it('Shows disconnect link when  connected', async () => {
    server.use(profileHandlerWithGoogleDrive);
    const testStore = mockStore({});
    renderComponent(<Integrations />, testStore);
    await screen.findByText(/3rd Party Apps/);
    expect(screen.getByText(/3rd Party Apps/)).toBeInTheDocument();
    expect(screen.getByText('Google Drive')).toBeInTheDocument();
    expect(screen.getByText('Disconnect')).toBeInTheDocument();
  });

  it('Shows potential 3rd party connections other than Google Drive', async () => {
    const testStore = mockStore({});
    server.use(profileHandlerWithIntegration);
    renderComponent(<Integrations />, testStore);
    await screen.findByText(/3rd Party Apps/);
    expect(screen.getByText(/3rd Party Apps/)).toBeInTheDocument();
    // Check that Google Drive is not rendered
    expect(screen.queryByText('Google Drive')).not.toBeInTheDocument();
    // Check that other integrations are rendered
    expect(screen.getByText('3rd Party Service')).toBeInTheDocument();
  });
});

describe('License Cell', () => {
  const testStore = mockStore({});

  it('should show the table header', async () => {
    renderComponent(<Licenses />, testStore);
    await screen.findByText(/Licenses/);
    expect(screen.getByText(/Licenses/)).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('show Request Activation button when license is not set', async () => {
    renderComponent(<Licenses />, testStore);
    await screen.findByText(/Licenses/);
    expect(
      screen.getByRole('button', { name: 'Request Activation' })
    ).toBeInTheDocument();
  });

  it('show Request Activation button when license is not set', async () => {
    renderComponent(<Licenses />, testStore);
    await screen.findByText(/Licenses/);
    expect(
      screen.getByRole('button', { name: 'Request Activation' })
    ).toBeInTheDocument();
  });

  it('opens ticket when Request Activation is clicked', async () => {
    renderComponent(<Licenses />, testStore);
    await screen.findByText(/Licenses/);
    const ticketButton = screen.getByRole('button', {
      name: 'Request Activation',
    });

    await userEvent.click(ticketButton);

    const newTicketButton = await screen.findByRole('button', {
      name: /New Ticket/i,
    });

    expect(screen.getByRole('link', { name: /MATLAB/ })).toHaveAttribute(
      'href',
      'http://www.mathworks.com/'
    );

    // open ticket modal and assert that it opens
    await userEvent.click(newTicketButton);
    expect(
      await screen.findByRole('button', { name: 'Add Ticket' })
    ).toBeInTheDocument();
  });

  it('show View Details button when license is activated', async () => {
    server.use(profileHandlerWithLicense);
    renderComponent(<Licenses />, testStore);
    await screen.findByText(/Licenses/);
    expect(
      screen.getByRole('button', { name: 'View Details' })
    ).toBeInTheDocument();
  });
});
