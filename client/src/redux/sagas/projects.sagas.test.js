import { expectSaga } from 'redux-saga-test-plan';
import * as matchers from 'redux-saga-test-plan/matchers';
import { vi } from 'vitest';
import {
  getProjectsListing,
  fetchProjectsListing,
  getMetadata,
  fetchMetadata,
  setMember,
  setMemberUtil,
  setTitleDescription,
  setTitleDescriptionUtil,
} from './projects.sagas';
import projectsReducer, { initialState } from '../reducers/projects.reducers';
import {
  projectsFixture,
  projectMetadataFixture,
  projectMetadataResponse,
  projectsListingFixture,
} from './fixtures/projects.fixture';

vi.mock('cross-fetch');

describe('Projects Sagas', () => {
  it('should get a listing of projects', () => {
    return expectSaga(getProjectsListing, { payload: { queryString: null } })
      .withReducer(projectsReducer)
      .provide([
        [matchers.call.fn(fetchProjectsListing), projectsListingFixture],
      ])
      .put({ type: 'PROJECTS_GET_LISTING_STARTED' })
      .call(fetchProjectsListing, null)
      .put({
        type: 'PROJECTS_GET_LISTING_SUCCESS',
        payload: projectsListingFixture,
      })
      .hasFinalState({
        ...initialState,
        ...projectsFixture,
      })
      .run();
  });
  it('should get project metadata', () => {
    return expectSaga(getMetadata, { payload: 'system' })
      .withReducer(projectsReducer)
      .provide([[matchers.call.fn(fetchMetadata), projectMetadataResponse]])
      .put({ type: 'PROJECTS_GET_METADATA_STARTED' })
      .call(fetchMetadata, 'system')
      .put({
        type: 'PROJECTS_GET_METADATA_SUCCESS',
        payload: projectMetadataResponse,
      })
      .hasFinalState({
        ...initialState,
        metadata: projectMetadataFixture,
      })
      .run();
  });
  it('should manage membership on a project', () => {
    const action = {
      type: 'PROJECTS_SET_MEMBER',
      payload: {
        projectId: 'PRJ-123',
        data: {
          action: 'add_member',
          username: 'username',
        },
      },
    };
    return expectSaga(setMember, action)
      .withReducer(projectsReducer)
      .provide([[matchers.call.fn(setMemberUtil), projectMetadataResponse]])
      .put({ type: 'PROJECTS_SET_MEMBER_STARTED' })
      .call(setMemberUtil, 'PRJ-123', {
        action: 'add_member',
        username: 'username',
      })
      .put({
        type: 'PROJECTS_SET_MEMBER_SUCCESS',
        payload: projectMetadataResponse,
      })
      .hasFinalState({
        ...initialState,
        metadata: projectMetadataFixture,
        operation: {
          name: 'member',
          loading: false,
          error: null,
          result: projectMetadataResponse,
        },
      })
      .run();
  });
  it('should allow change to project title description', () => {
    const action = {
      type: 'PROJECTS_SET_TITLE_DESCRIPTION',
      payload: {
        projectId: 'PRJ-123',
        data: {
          title: 'new title',
          description: 'new description',
        },
      },
    };
    const updatedProjectMetadataResponse = {
      ...projectMetadataResponse,
      title: action.payload.data.title,
      description: action.payload.data.description,
    };
    return expectSaga(setTitleDescription, action)
      .withReducer(projectsReducer)
      .provide([
        [
          matchers.call.fn(setTitleDescriptionUtil),
          updatedProjectMetadataResponse,
        ],
      ])
      .put({ type: 'PROJECTS_SET_TITLE_DESCRIPTION_STARTED' })
      .call(setTitleDescriptionUtil, 'PRJ-123', action.payload.data)
      .put({
        type: 'PROJECTS_SET_TITLE_DESCRIPTION_SUCCESS',
        payload: updatedProjectMetadataResponse,
      })
      .hasFinalState({
        ...initialState,
        metadata: {
          ...projectMetadataFixture,
          title: 'new title',
          description: 'new description',
        },
        operation: {
          name: 'titleDescription',
          loading: false,
          error: null,
          result: updatedProjectMetadataResponse,
        },
      })
      .run();
  });
});
