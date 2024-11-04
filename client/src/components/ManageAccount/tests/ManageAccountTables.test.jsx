import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import '@testing-library/jest-dom/extend-expect';
import {
  ProfileInformation,
  PasswordInformation,
  Integrations,
  Licenses,
} from '../ManageAccountTables';

const dummyState = {
  isLoading: false,
  checkingPassword: false,
  editing: false,
  success: {
    optional: false,
    required: false,
    password: false,
  },
  data: {
    demographics: {
      username: 'ojamil',
      email: 'ojamil@tacc.utexas.edu',
      firstName: 'Owais',
      lastName: 'Jamil',
      institution: 'University of Texas at Austin',
      institutionId: 1,
      citizenship: 'United States',
      citizenshipId: 230,
      phone: '512-919-9153',
      title: 'Center Non-Researcher Staff',
    },
    licenses: [],
    integrations: [
      {
        label: 'Google Drive',
        description: 'test description',
        activated: false,
        disconnect: 'https://disconnect.com',
        connect: 'https://google.com',
      },
    ],
    passwordLastChanged: '6/1/2020',
  },
  errors: {},
};

const mockStore = configureStore({});

describe('Profile Information Component', () => {
  let getByText;
  const testStore = mockStore({
    profile: dummyState,
  });
  beforeEach(() => {
    const utils = render(
      <Provider store={testStore}>
        <ProfileInformation />
      </Provider>
    );
    getByText = utils.getByText;
  });

  test('Show column headings and content', () => {
    expect(getByText(/^Profile Information/)).toBeInTheDocument();
    const headings = [
      'Full Name',
      'Email',
      'Institution',
      'Country of Citizenship',
    ];
    headings.forEach((heading) => {
      expect(getByText(heading)).toBeInTheDocument();
    });
  });
  test('should have a button to go to an external site for profile editing', async () => {
    expect(
      getByText(/Edit Profile Information/)
        .closest('a')
        .getAttribute('href')
    ).toBe('https://accounts.tacc.utexas.edu/profile');
  });
});

describe('Change Password Component', () => {
  let getByText, getAllByText;
  const testStore = mockStore({
    profile: dummyState,
  });
  beforeEach(() => {
    const utils = render(
      <Provider store={testStore}>
        <PasswordInformation />
      </Provider>
    );
    getByText = utils.getByText;
    getAllByText = utils.getAllByText;
  });

  it('should show the user the last time they changed their password', () => {
    expect(getByText(/Last Changed/)).toBeInTheDocument();
    expect(getByText(/6\/1\/2020/)).toBeInTheDocument();
  });

  it('should have a button for users to go to external site for password change', async () => {
    expect(
      getByText(/Change Password/)
        .closest('a')
        .getAttribute('href')
    ).toBe('https://accounts.tacc.utexas.edu/change_password');
  });
});

describe('Third Party Apps', () => {
  let getByText;

  it('Shows connect link when not connected', () => {
    const testStore = mockStore({
      profile: dummyState,
    });
    const { getByText, queryByText } = render(
      <Provider store={testStore}>
        <Integrations />
      </Provider>
    );
    expect(getByText(/3rd Party Apps/)).toBeDefined();
    // Temporary Integrations Filtering and conditional rendering of Google Drive: WP-24
    expect(queryByText('Google Drive')).toBeNull();
    expect(queryByText('Setup Google Drive')).toBeNull();
  });
  it('Shows disconnect link when  connected', () => {
    const testStore = mockStore({
      profile: {
        ...dummyState,
        data: {
          ...dummyState.data,
          integrations: [
            {
              label: 'Google Drive',
              description: 'test description',
              activated: true,
              disconnect: 'https://disconnect.com',
              connect: 'https://google.com',
            },
          ],
        },
      },
    });
    const { getByText, queryByText } = render(
      <Provider store={testStore}>
        <Integrations />
      </Provider>
    );
    expect(getByText(/3rd Party Apps/)).toBeDefined();
    // Temporary Integrations Filtering and conditional rendering of Google Drive: WP-24
    expect(queryByText('Google Drive')).toBeNull();
    expect(queryByText('Setup Google Drive')).toBeNull();
    expect(getByText('No integrations available.')).toBeInTheDocument();
  });
  it('Shows potential 3rd party connections other than Google Drive', () => {
    const testStore = mockStore({
      profile: {
        ...dummyState,
        data: {
          ...dummyState.data,
          integrations: [
            {
              label: '3rd Party Service',
              description: '3rd Party Service description',
              activated: true,
            },
          ],
        },
      },
    });
    const { getByText, queryByText } = render(
      <Provider store={testStore}>
        <Integrations />
      </Provider>
    );
    expect(getByText(/3rd Party Apps/)).toBeInTheDocument();
    // Check that Google Drive is not rendered
    expect(queryByText('Google Drive')).toBeNull();
    // Check that other integrations are rendered
    expect(getByText('3rd Party Service')).toBeInTheDocument();
  });
});

describe('License Cell', () => {
  let getByText, getByRole;
  const testStore = mockStore({
    profile: dummyState,
  });
  beforeEach(() => {
    const utils = render(
      <Provider store={testStore}>
        <Licenses />
      </Provider>
    );
    getByText = utils.getByText;
    getByRole = utils.getByRole;
  });

  it('should show the table header', () => {
    expect(getByText(/Licenses/)).toBeInTheDocument();
    expect(getByRole('table')).toBeDefined();
  });
});
