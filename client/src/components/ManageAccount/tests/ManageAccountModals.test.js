import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { IntegrationModal } from '../ManageAccountModals';

const dummyState = {
  isLoading: false,
  editing: false,
  success: {
    optional: false,
    required: false,
    password: false,
  },
  data: {
    demographics: {
      ethnicity: 'Asian',
      gender: 'Male',
      username: 'tuser',
      email: 'testuser@gmail.com',
      firstName: 'Test',
      lastName: 'User',
      phone: '512-555-5555',
      title: 'Center Non-Researcher Staff',
      // Required Information Fields Provided By TAS
      institution: 'University of Texas at Austin',
      institutionId: 1,
      country: 'United States',
      countryId: 230,
      citizenship: 'United States',
      citizenshipId: 230,
      // Optional Information
      bio: '',
      website: '',
      orcid_id: '',
      professional_level: '',
    },
  },
  errors: {},
  fields: {},
  modals: {
    required: false,
    optional: false,
    password: true,
  },
};

describe('Change Password', () => {
  test('Change Password Form', async () => {
    // Render Modal
    const testStore = mockStore({ profile: dummyState });
    const { getAllByText, getByText, getByLabelText, getByTestId, rerender } =
      render(
        <Provider store={testStore}>
          <ChangePasswordModal />
        </Provider>
      );
    // Check for Modal Header to Be Visible
    expect(getAllByText(/Change Password/)).toBeDefined();

    // Check for Form Labels to Be Visible
    expect(getByText(/Current Password/)).toBeDefined();
    expect(getAllByText(/New Password/)).toBeDefined();
    expect(getByText(/Confirm New Password/)).toBeDefined();
    expect(
      getByText(/Passwords must meet the following criteria:/)
    ).toBeDefined();

    // Check Validation Error
    const current = getByLabelText(/current-password/);
    const newPassword = getByLabelText(/^new-password/);
    const confirm = getByLabelText(/confirm-new-password/);
    const submit = getByTestId(/submit-button/);

    fireEvent.change(current, {
      target: {
        value: 'testuser',
      },
    });
    fireEvent.change(newPassword, {
      target: {
        value: 'testuser',
      },
    });
    fireEvent.change(confirm, {
      target: {
        value: 'testuser',
      },
    });

    await waitFor(() => {
      expect(
        getByText(/Your new password must be different from your old password/)
      ).toBeDefined();
    });

    // Submit
    fireEvent.change(current, {
      target: {
        value: 'testpassword',
      },
    });
    fireEvent.change(newPassword, {
      target: {
        value: 'Newpassword1',
      },
    });
    fireEvent.change(confirm, {
      target: {
        value: 'Newpassword1',
      },
    });

    // Dispatch
    fireEvent.submit(submit);
    await waitFor(() => {
      expect(testStore.getActions()).toHaveLength(1);
    });

    // Loading
    rerender(
      <Provider
        store={mockStore({
          profile: {
            ...dummyState,
            checkingPassword: true,
          },
        })}
      >
        <ChangePasswordModal />
      </Provider>
    );
    expect(getByText(/Loading/)).toBeDefined();

    // Success
    const successStore = mockStore({
      profile: {
        ...dummyState,
        success: {
          password: true,
        },
      },
    });
    rerender(
      <Provider store={successStore}>
        <ChangePasswordModal />
      </Provider>
    );
    expect(
      getByText(/Your password has been successfully changed./)
    ).toBeDefined();

    // Close Modal
    const closeButton = getByLabelText(/Close/);
    fireEvent.click(closeButton);
    await waitFor(() => {
      const [close, reload] = successStore.getActions();
      expect(close.type).toEqual('CLOSE_PROFILE_MODAL');
      expect(reload.type).toEqual('GET_PROFILE_DATA');
    });
  });
});

describe('connect google drive', () => {
  it('should render privacy policy and link', () => {
    const { getByText } = render(
      <IntegrationModal
        active={true}
        toggle={() => {}}
        connect={'/accounts/applications/googledrive/initialize/'}
        label={'Google Drive'}
      />
    );
    expect(getByText(/Google Drive Privacy Policy/)).toBeDefined();
    expect(
      getByText(/Agree and Connect to Google Drive/)
        .closest('a')
        .getAttribute('href')
    ).toBe('/accounts/applications/googledrive/initialize/');
  });
});
