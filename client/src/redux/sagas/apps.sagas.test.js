import {
  fetchAppTrayUtil,
  getAppTray
} from "./apps.sagas";
import { appTrayFixture, appTrayExpectedFixture } from "./fixtures/apptray.fixture";
import { apps as appsReducer } from '../reducers/apps.reducers';
import { expectSaga } from "redux-saga-test-plan";
import * as matchers from "redux-saga-test-plan/matchers";

jest.mock('cross-fetch');

describe("getAppTray", () => {
  it("runs saga", async () => {
    expectSaga(getAppTray, {})
      .withReducer(appsReducer)
      .provide([
        [matchers.call.fn(fetchAppTrayUtil), appTrayFixture]
      ])
      .put({
        type: "GET_APPS_START"
      })
      .call(fetchAppTrayUtil)
      .put({
        type: "GET_APPS_SUCCESS",
        payload: appTrayFixture
      })
      .hasFinalState(appTrayExpectedFixture)
      .run()
  });
});
