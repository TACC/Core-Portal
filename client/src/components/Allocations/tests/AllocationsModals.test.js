import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import configureStore from "redux-mock-store";
import { Provider } from "react-redux";
import { NewAllocReq, TeamView } from "../AllocationsModals";

const mockStore = configureStore();

describe("New Allocations Request Modal", () => {
  test("Allocations Request UI", () => {
    const { getByText, getByTestId } = render(
      <BrowserRouter>
        <NewAllocReq isOpen toggle={() => null} />
      </BrowserRouter>
    );
    expect(getByText("Manage Allocations")).toBeDefined();
    expect(getByTestId("request-body")).toBeDefined();
  });
});


describe("View Team Modal", () => {
  const testProps = {
    isOpen: true,
    toggle: () => null,
    pid: 1234,
  };

  test("View Team Modal Loading", () => {
    const testStore = mockStore({
      allocations: {
        teams: {
          1234: [],
        },
        loadingUsernames: {
          1234: {
            loading: true,
          },
        },
        errors: {},
      },
    });
    const { getByText } = render(
      <Provider store={testStore}>
        <TeamView {...testProps} />
      </Provider>
    );

    expect(getByText(/Loading user list./)).toBeDefined();
  });

  test("View Team Modal Listing", () => {
    const testStore = mockStore({
      allocations: {
        teams: {
          "1234": [
            {
              id: "123456",
              username: "testuser1",
              role: "Standard",
              firstName: "Test",
              lastName: "User1",
              email: "user1@gmail.com",
              usageData: [],
            },
            {
              id: "012345",
              username: "testuser2",
              role: "Standard",
              firstName: "Test",
              lastName: "User2",
              email: "user2@gmail.com",
              usageData: [
                {
                  usage: 0.5,
                  resource: "stampede2.tacc.utexas.edu",
                  allocationId: 1,
                  percentUsed: 0.005,
                },
                {
                  usage: 10,
                  resource: "frontera.tacc.utexas.edu",
                  allocationId: 2,
                  percentUsed: 10,
                },
              ],
            },
          ],
        },
        loadingUsernames: {
          "1234": {
            loading: false,
          },
        },
        errors: {},
      },
    });

    // Render Modal
    const { getByText, queryByText, getByRole } = render(
      <Provider store={testStore}>
        <TeamView {...testProps} />
      </Provider>
    );

    // Check for the list of users
    expect(getByText(/View Team/)).toBeDefined();
    expect(getByText(/Test User1/)).toBeDefined();
    expect(getByText(/Test User2/)).toBeDefined();

    // View Information for the user without usage
    fireEvent.click(getByText(/Test User1/));
    expect(getByText(/Username:/)).toBeDefined();
    expect(getByText(/Email:/)).toBeDefined();
    expect(queryByText(/Usage/)).toBeNull();

    // View information for the user with usage
    fireEvent.click(getByText(/Test User2/));
    expect(getByText(/Usage/)).toBeDefined();
  });

  test("View Team Modal Errors", () => {
    const testStore = mockStore({
      allocations: {
        teams: {
          1234: [],
        },
        loadingUsernames: {
          1234: {
            loading: true,
          },
        },
        errors: {
          teams: { 1234: new Error('Unable to fetch') }
        },
      },
    });

    const { getByText } = render(
      <Provider store={testStore}>
        <TeamView {...testProps} />
      </Provider>
    );
    
    expect(getByText(/Unable to retrieve team data./)).toBeDefined();
  });
});
