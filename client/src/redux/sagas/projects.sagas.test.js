import { expectSaga } from "redux-saga-test-plan";
import * as matchers from "redux-saga-test-plan/matchers";
import {
  getProjectsListing,
  fetchProjectsListing,
  getMetadata,
  fetchMetadata
} from "./projects.sagas";
import projectsReducer, { initialState } from '../reducers/projects.reducers';
import { 
  projectsFixture,
  projectMetadataFixture,
  projectMetadataResponse,
  projectsListingFixture
} from './fixtures/projects.fixture';

jest.mock("cross-fetch");

describe("Projects Sagas", () => {
  it("should get a listing of projects", () => {
    return expectSaga(getProjectsListing)
      .withReducer(projectsReducer)
      .provide([
        [
          matchers.call.fn(fetchProjectsListing),
          projectsListingFixture
        ],
      ])
      .put({ type: "PROJECTS_GET_LISTING_STARTED" })
      .call(fetchProjectsListing)
      .put({
        type: "PROJECTS_GET_LISTING_SUCCESS",
        payload: projectsListingFixture,
      })
      .hasFinalState({
        ...initialState,
        ...projectsFixture,
      })
      .run();
  });
  it("should get project metadata", () => {
    return expectSaga(getMetadata, { payload: 'system' })
      .withReducer(projectsReducer)
      .provide([
        [
          matchers.call.fn(fetchMetadata),
          projectMetadataResponse
        ]
      ])
      .put({ type: "PROJECTS_GET_METADATA_STARTED" })
      .call(fetchMetadata, "system")
      .put({
        type: "PROJECTS_GET_METADATA_SUCCESS",
        payload: projectMetadataResponse
      })
      .hasFinalState({
        ...initialState,
        metadata: projectMetadataFixture 
      })
      .run();
  });
});
