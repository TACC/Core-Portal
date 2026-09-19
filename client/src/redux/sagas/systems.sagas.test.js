import { expectSaga } from 'redux-saga-test-plan';
import { pushSystemKeys } from '../sagas/systems.sagas';
import { fetchUtil } from 'utils/fetchUtil';
import { vi } from 'vitest';

// Mocks the cross-fetch
vi.mock('cross-fetch');

// Test the pushSystemKeys function
describe('pushSystemKeys', () => {
  it('updates system data', () => {
    // Create a mock form for the fetchUtil call
    const mockForm = {
      password: 'mockPassword',
      token: 'mockToken',
      hostname: 'mockHostname',
    };
    const action = {
      type: 'SYSTEMS_PUSH_KEYS',
      payload: {
        systemId: 'test.system',
        hostname: 'mockHostname',
        password: 'mockPassword',
        token: 'mockToken',
        reloadCallback: () => {},
        onSuccess: () => {},
      },
    };
    expectSaga(pushSystemKeys, action)
      // Sends the call to update the systems modal
      .put({
        type: 'SYSTEMS_MODAL_UPDATE',
        payload: {
          operation: 'pushKeys',
          props: { submitting: true },
        },
      })
      // Sends the form information to the API url indicated
      .call(fetchUtil, {
        url: `/api/accounts/systems/test.system/keys/`,
        body: JSON.stringify({ mockForm, action: 'push' }),
        method: 'PUT',
      })
      // Toggles the modal state when successful
      .put({
        type: 'SYSTEMS_TOGGLE_MODAL',
        payload: {
          operation: 'pushKeys',
          props: {},
        },
      });
  });
});
