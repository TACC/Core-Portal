import React from "react";
import {
  render,
  wait,
  fireEvent
} from "@testing-library/react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { ChangePasswordModal, EditOptionalInformationModal, EditRequiredInformationModal } from "../ManageAccountModals";

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
      username: "tuser",
      email: "testuser@gmail.com",
      firstName: "Test",
      lastName: "User",
      phone: "512-555-5555",
      title: "Center Non-Researcher Staff",
      // Required Information Fields Provided By TAS
      institution: "University of Texas at Austin",
      institutionId: 1,
      country: "United States",
      countryId: 230,
      citizenship: "United States",
      citizenshipId: 230,
      // Optional Information
      bio: "",
      website: "",
      orcid_id: "",
      professional_level: "",
    }
  },
  errors: {},
  fields: {},
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
      getByTestId,
      rerender
    } = render(
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
      <Provider
        store={successStore}
      >
        <ChangePasswordModal />
      </Provider>
    );
    expect(getByText(/Your password has been successfully changed./)).toBeDefined();

    // Close Modal
    const closeButton = getByLabelText(/Close/);
    fireEvent.click(closeButton);
    await wait(() => {
      const [close, reload] = successStore.getActions();
      expect(close.type).toEqual('CLOSE_PROFILE_MODAL');
      expect(reload.type).toEqual('LOAD_PROFILE_DATA');
    });
  });
});

describe("Edit Optional Information", () => {
  let getByText, rerender, getByLabelText;
  beforeEach(() => {
    const testState = {
      ...dummyState,
      modals: {
        optional: true,
      },
    };
    const testStore = mockStore({ profile: testState });
    const utils = render(
      <Provider store={testStore}>
        <EditOptionalInformationModal />
      </Provider>
    );
    getByText = utils.getByText;
    rerender = utils.rerender;
    getByLabelText = utils.getByLabelText;
  });
  
  it("should show the loading spinner when fetching form data", () => {
    expect(getByText(/Loading.../)).toBeDefined();
  });

  it("should render a form for optional information", async () => {
    const stateWithFields = {
      ...dummyState,
      fields: {
        countries: [[230, "United States"]],
        institutions: [[1, "University of Texas at Austin"]],
        ethnicities: [["Decline", "Decline to Identify"]],
        genders: [["Other", "Other"]],
        professionalLevels: [["Other", "Other"]],
        titles: [["Other User", "Other User"]],
      },
    };
    const storeWithFields = mockStore({ profile: stateWithFields });
    rerender(
      <Provider store={storeWithFields}>
        <EditOptionalInformationModal />
      </Provider>
    );

    // Check for labels
    ["Website", "Orcid ID", "Professional Level", "Bio"].forEach((label) => {
      expect(getByText(label)).toBeDefined();
    });

    const submitButton = getByLabelText(
      /edit-optional-information-submit-button/
    );
    fireEvent.click(submitButton);
    await wait(() => {
      expect(storeWithFields.getActions()).toHaveLength(1);
    });

  });

  it("should render a loading spinner when the form data is being sent to the back-end", () => {
    const stateWithFields = {
      ...dummyState,
      fields: {
        countries: [[230, "United States"]],
        institutions: [[1, "University of Texas at Austin"]],
        ethnicities: [["Decline", "Decline to Identify"]],
        genders: [["Other", "Other"]],
        professionalLevels: [["Other", "Other"]],
        titles: [["Other User", "Other User"]],
      },
    };
    rerender(
      <Provider
        store={mockStore({
          profile: {
            ...stateWithFields,
            editing: true,
          },
        })}
      >
        <EditOptionalInformationModal />
      </Provider>
    );
    expect(getByText(/Loading.../)).toBeDefined();
  });

  it("should dispatch actions on close", async () => {
    const store = mockStore({
      profile: {
        ...dummyState,
        fields: {
          countries: [[230, "United States"]],
          institutions: [[1, "University of Texas at Austin"]],
          ethnicities: [["Decline", "Decline to Identify"]],
          genders: [["Other", "Other"]],
          professionalLevels: [["Other", "Other"]],
          titles: [["Other User", "Other User"]],
        },
        editing: false,
        success: { optional: true },
      },
    });
    rerender(
      <Provider store={store}>
        <EditOptionalInformationModal />
      </Provider>
    );
    expect(getByText(/Successfully Edited/)).toBeDefined();
    const closeButton = getByLabelText(/Close/);
    fireEvent.click(closeButton);
    await wait(() => {
      const [close, reload] = store.getActions();
      expect(close.type).toEqual('CLOSE_PROFILE_MODAL');
      expect(reload.type).toEqual('LOAD_PROFILE_DATA');
    });
  })

});

describe("Edit Required Information", () => {
  const testState = { ...dummyState, modals: { required: true } };
  let getByText, rerender, getByLabelText;
  beforeEach(() => {
    const testStore = mockStore({
      profile: testState,
    });
    const utils = render(
      <Provider store={testStore}>
        <EditRequiredInformationModal />
      </Provider>
    );
    getByText = utils.getByText;
    rerender = utils.rerender;
    getByLabelText = utils.getByLabelText;
  });

  it("should render a loading spinner when form data is being fetched", () => {
    expect(getByText(/Loading.../)).toBeDefined();
    expect(getByText(/Edit Required Information/)).toBeDefined();
  });

  it("should render a form", () => {
    const stateWithFields = {
      ...testState,
      fields: {
        countries: [[230, "United States"]],
        institutions: [[1, "University of Texas at Austin"]],
        ethnicities: [["Decline", "Decline to Identify"]],
        genders: [["Other", "Other"]],
        professionalLevels: [["Other", "Other"]],
        titles: [["Other User", "Other User"]],
      },
    };
    const storeWithFields = mockStore({ profile: stateWithFields });

    rerender(
      <Provider store={storeWithFields}>
        <EditRequiredInformationModal />
      </Provider>
    );

    [
      "First Name",
      "Last Name",
      "Email Address",
      "Phone Number",
      "Institution",
      "Position/Title",
      "Residence",
      "Ethnicity",
      "Gender",
    ].forEach(label => {
      expect(getByText(label)).toBeDefined();
    });

    expect(getByText(/Submit/)).toBeDefined();

  });

  it("should show users errors if the fields are missing or invalid", async () => {
    const stateWithFields = {
      ...testState,
      fields: {
        countries: [[230, "United States"]],
        institutions: [[1, "University of Texas at Austin"]],
        ethnicities: [["Decline", "Decline to Identify"]],
        genders: [["Other", "Other"]],
        professionalLevels: [["Other", "Other"]],
        titles: [["Other User", "Other User"]],
      },
    };
    const storeWithFields = mockStore({ profile: stateWithFields });

    rerender(
      <Provider store={storeWithFields}>
        <EditRequiredInformationModal />
      </Provider>
    );
    
    const emailField = getByLabelText(/email/);
    const phoneField = getByLabelText(/phone/);
    const submitButton = getByLabelText(/required-submit/);
    
    // Invalid Entries
    fireEvent.change(emailField, {
      target: {
        value: "email"
      }
    });
    fireEvent.change(phoneField, {
      target: {
        value: "123"
      }
    });
    const clickSpy = () => jest.fn();
    submitButton.addEventListener('click', clickSpy, false)
    fireEvent.click(submitButton);
    wait(() => {
      expect(getByText(/Please enter a valid email address/)).toBeDefined();
      expect(getByText(/Phone number is not valid/)).toBeDefined();
      expect(clickSpy).not.toHaveBeenCalled();
    });
    
  });
  
  it("should render a loading spinner when the form data is being sent to the back-end", () => {
    const stateWithFields = {
      ...testState,
      editing: true,
      fields: {
        countries: [[230, "United States"]],
        institutions: [[1, "University of Texas at Austin"]],
        ethnicities: [["Decline", "Decline to Identify"]],
        genders: [["Other", "Other"]],
        professionalLevels: [["Other", "Other"]],
        titles: [["Other User", "Other User"]],
      },
    };
    const storeWithFields = mockStore({ profile: stateWithFields });

    rerender(
      <Provider store={storeWithFields}>
        <EditRequiredInformationModal />
      </Provider>
    );
    expect(getByText(/Loading.../)).toBeDefined();
  })

  it("should close and reload the modal on success", async () => {
    const store = mockStore({
      profile: {
        ...dummyState,
        fields: {
          countries: [[230, "United States"]],
          institutions: [[1, "University of Texas at Austin"]],
          ethnicities: [["Decline", "Decline to Identify"]],
          genders: [["Other", "Other"]],
          professionalLevels: [["Other", "Other"]],
          titles: [["Other User", "Other User"]],
        },
        editing: false,
        success: { required: true },
      },
    });
    // Mock scrollIntoView (not a part of jsdom)
    window.HTMLElement.prototype.scrollIntoView = jest.fn()
    rerender(
      <Provider store={store}>
        <EditRequiredInformationModal />
      </Provider>
    );
    expect(getByText(/Successfully Edited/)).toBeDefined();
    const closeButton = getByLabelText(/Close/);
    fireEvent.click(closeButton);
    await wait(() => {
      const [close, reload] = store.getActions();
      expect(close.type).toEqual('CLOSE_PROFILE_MODAL');
      expect(reload.type).toEqual('LOAD_PROFILE_DATA');
    });
  })

});
