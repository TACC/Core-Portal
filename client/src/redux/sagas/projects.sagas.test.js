import { expectSaga } from "redux-saga-test-plan";
import * as matchers from "redux-saga-test-plan/matchers";
import {
  getProjectsListing,
  fetchProjectsListing
} from "./projects.sagas";
import projectsReducer, { initialState } from '../reducers/projects.reducers';
import projectsListingFixture from './fixtures/projects.fixture';

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
        listing: {
          projects: projectsListingFixture,
          error: null,
          loading: false
        }
      })
      .run();
  });
});
