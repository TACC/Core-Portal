import React from 'react';
import { render, wait, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { initialState as workbench } from '../../../redux/reducers/workbench.reducers';
import configureStore from 'redux-mock-store';
import '@testing-library/jest-dom/extend-expect';
import {
  RequiredInformation,
  OptionalInformation,
  ChangePassword,
  Integrations,
  Licenses
} from '../ManageAccountTables';

const dummyState = {
  isLoading: false,
  checkingPassword: false,
  editing: false,
  success: {
    optional: false,
    required: false,
    password: false
  },
  data: {
    demographics: {
      ethnicity: 'Asian',
      gender: 'Male',
      bio: '',
      website: 'http://owais.io',
      orcid_id: 'test',
      professional_level: 'Staff (support, administration, etc)',
      username: 'ojamil',
      email: 'ojamil@tacc.utexas.edu',
      firstName: 'Owais',
      lastName: 'Jamil',
      institution: 'University of Texas at Austin',
      institutionId: 1,
      country: 'United States',
      countryId: 230,
      citizenship: 'United States',
      citizenshipId: 230,
      phone: '512-919-9153',
      title: 'Center Non-Researcher Staff'
    },
    licenses: [],
    integrations: [
      {
        label: 'Google Drive',
        description: 'test description',
        activated: false
      }
    ],
    passwordLastChanged: '6/1/2020'
  },
  errors: {},
  fields: {},
  modals: {}
};

const mockStore = configureStore({});

describe('Required Information Component', () => {
  let getByText;
  const testStore = mockStore({
    profile: dummyState
  });
  beforeEach(() => {
    const utils = render(
      <Provider store={testStore}>
        <RequiredInformation />
      </Provider>
    );
    getByText = utils.getByText;
  });

  test('Show column headings and content', () => {
    expect(getByText(/^Required Information/)).toBeInTheDocument();
    const headings = [
      'Full Name',
      'Phone No.',
      'Email',
      'Institution',
      'Title',
      'Country of Residence',
      'Country of Citizenship',
      'Ethnicity',
      'Gender'
    ];
    headings.forEach(heading => {
      expect(getByText(heading)).toBeInTheDocument();
    });
  });
  test('Button to open form modal', async () => {
    const button = getByText(/Edit Required Information/);
    fireEvent.click(button);
    await wait(() => {
      const { type, payload } = testStore.getActions()[0];
      expect(type).toEqual('OPEN_PROFILE_MODAL');
      expect(payload).toEqual({ required: true });
    });
  });
});

describe('Change Password Component', () => {
  let getByText, getAllByText;
  const testStore = mockStore({
    profile: dummyState
  });
  beforeEach(() => {
    const utils = render(
      <Provider store={testStore}>
        <ChangePassword />
      </Provider>
    );
    getByText = utils.getByText;
    getAllByText = utils.getAllByText;
  });

  it('should show the user the last time they changed their password', () => {
    expect(getByText(/Last Changed/)).toBeInTheDocument();
    expect(getByText(/6\/1\/2020/)).toBeInTheDocument();
  });

  it('should have a button for users to open the change password modal', async () => {
    expect(getAllByText(/Change Password/)).toHaveLength(2);
    const button = getAllByText(/Change Password/)[1];
    fireEvent.click(button);
    await wait(() => {
      const { type, payload } = testStore.getActions()[0];
      expect(type).toEqual('OPEN_PROFILE_MODAL');
      expect(payload).toEqual({ password: true });
    });
  });
});

describe('Third Party Apps', () => {
  let getByText;

  it('Shows connect link when not connected', () => {
    const testStore = mockStore({
      profile: dummyState
    });
    const { getByText } = render(
      <Provider store={testStore}>
        <Integrations />
      </Provider>
    );
    expect(getByText(/3rd Party Apps/)).toBeDefined();
    expect(getByText('Google Drive')).toBeDefined();
    expect(getByText('Setup Google Drive')).toBeDefined();
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
              activated: true
            }
          ]
        }
      }
    });
    const { getByText } = render(
      <Provider store={testStore}>
        <Integrations />
      </Provider>
    );
    expect(getByText(/3rd Party Apps/)).toBeDefined();
    expect(getByText('Google Drive')).toBeDefined();
    expect(getByText('Disconnect')).toBeDefined();
  });
});

describe('Optional Information Component', () => {
  let getByText;
  const testStore = mockStore({
    profile: dummyState
  });
  beforeEach(() => {
    const utils = render(
      <Provider store={testStore}>
        <OptionalInformation />
      </Provider>
    );
    getByText = utils.getByText;
  });

  it('should show optional information fields', () => {
    const headings = [
      'Orcid ID',
      'Professional Level',
      'Research Bio',
      'My Website'
    ];
    headings.forEach(heading => {
      expect(getByText(heading)).toBeInTheDocument();
    });
  });
  it('should have a button that opens a redux controlled modal', async () => {
    const button = getByText(/Edit Optional Information/);
    fireEvent.click(button);
    await wait(() => {
      const [action] = testStore.getActions();
      expect(action.type).toEqual('OPEN_PROFILE_MODAL');
      expect(action.payload).toEqual({ optional: true });
    });
  });
});

describe('License Cell', () => {
  let getByText, getByRole;
  const testStore = mockStore({
    profile: dummyState
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
    expect(getByRole(/table/)).toBeDefined();
  });
});
