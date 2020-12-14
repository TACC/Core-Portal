import React from "react";
import { createMemoryHistory } from "history";
import  DataFilesAddProjectModal  from "../DataFilesAddProjectModal";
import configureStore from "redux-mock-store";
import renderComponent from 'utils/testing';
import {
  projectsListingFixture,
  projectMetadataFixture
} from '../../../../redux/sagas/fixtures/projects.fixture';
const mockStore = configureStore();

const initialMockState = {
  files: {
    modals: {
      addproject: true
    }
  },
  users: {
    search: {
      users: []
    }
  },
  projects: {
    listing: {
      project: projectsListingFixture,
      loading: false,
      error: null
    },
    metadata: projectMetadataFixture
  },
  authenticatedUser: {
    user: {
      username: "username",
      first_name: "User",
      last_name: "Name",
      email: "user@name.com"
    }
  }
};


describe("DataFilesAddProjectModal", () => {
  it("renders the add project modal", () => {
    const store = mockStore(initialMockState);
    const history = createMemoryHistory();
    history.push('/workbench/data/tapis/private/test.system/');
    const { getAllByText } = renderComponent(
      <DataFilesAddProjectModal />,
      store,
      history
    )

    // Check that the authenticated user appears as the default owner
    // for a new project
    expect(getAllByText(/User Name/)).toBeDefined();
  });
});
