import React from "react";
import {
  render,
  wait,
  fireEvent
} from "@testing-library/react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { ChangePassword, EditOptionalInformation, EditRequiredInformation } from "../ManageAccountModals";

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
      ethnicity: "Asian",
      gender: "Male",
      bio: "",
      website: "http://owais.io",
      orcid_id: "test",
      professional_level: "Staff (support, administration, etc)",
      username: "ojamil",
      email: "ojamil@tacc.utexas.edu",
      firstName: "Owais",
      lastName: "Jamil",
      institution: "University of Texas at Austin",
      institutionId: 1,
      country: "United States",
      countryId: 230,
      citizenship: "United States",
      citizenshipId: 230,
      phone: "512-919-9153",
      title: "Center Non-Researcher Staff",
    }
  },
  errors: {},
  fields: {
    countries: [
      [230, "United States"]
    ],
    institutions: [
      [1, "University of Texas at Austin"]
    ],
    ethnicities: [
      ["Decline", "Decline to Identify"]
    ],
    genders: [
      ["Other", "Other"]
    ],
    professionalLevels: [
      ["Other", "Other"]
    ],
    titles: [
      ["Other User", "Other User"]
    ]
  },
  modals: {
    required: false,
    optional: false,
    password: true,
  },
};

const mockStore = configureStore({});

describe("Change Password", () => {
  test("Change Password Form", async () => {
    // Render Modal
    const testStore = mockStore({ profile: dummyState });
    const {
      getAllByText,
      getByText,
      getByLabelText,
      getByTestId, rerender
    } = render(
      <Provider store={testStore}>
        <ChangePassword />
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
        value: "testuser",
      },
    });
    fireEvent.change(newPassword, {
      target: {
        value: "testuser",
      },
    });
    fireEvent.change(confirm, {
      target: {
        value: "testuser",
      },
    });

    await wait(() => {
      expect(
        getByText(/Your new password must be different from your old password/)
      ).toBeDefined();
    });

    // Submit
    fireEvent.change(current, {
      target: {
        value: "testpassword",
      },
    });
    fireEvent.change(newPassword, {
      target: {
        value: "Newpassword1",
      },
    });
    fireEvent.change(confirm, {
      target: {
        value: "Newpassword1",
      },
    });

    // Dispatch
    fireEvent.submit(submit);
    await wait(() => {
      expect(testStore.getActions()).toHaveLength(1);
    });

    // Loading
    rerender(
      <Provider
        store={mockStore({
          profile: {
            ...dummyState,
            checkingPassword: true
          }
        })}
      >
        <ChangePassword />
      </Provider>
    );
    expect(getByText(/Loading/)).toBeDefined();

    // Success
    rerender(
      <Provider
        store={mockStore({
          profile: {
            ...dummyState,
            success: {
              password: true
            }
          }
        })}
      >
        <ChangePassword />
      </Provider>
    );
    expect(getByText(/Your password has been successfully changed!/)).toBeDefined();

  });
});

describe("Edit Optional Information", () => {
  test("Edit Optional Information Form", () => {
    // Render Modal
    const testStore = mockStore({
      profile: {
        ...dummyState,
        modals: {
          optional: true,
        },
      },
    });
    const { getByText, debug, rerender } = render(
      <Provider store={testStore}>
        <EditOptionalInformation />
      </Provider>
    );
    expect(getByText(/Loading.../)).toBeDefined();
    
    // Re-render with fields

    // Check for labels

    // Validation

    // Submit

    // Success

    debug();
  });
});
// describe("Edit Required Information");
