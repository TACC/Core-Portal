import { expectSaga } from 'redux-saga-test-plan';
import { pushSystemKeys } from 'redux-saga/effects';
import { fetchUtil } from 'utils/fetchUtil';
import { vi } from 'vitest';

// Mocks the cross-fetch
vi.mock('cross-fetch');

// Test the pushSystemKeys function
describe('pushSystemKeys', () => {
  it('updates system data'),
    () => {
      // Create a mock form for the fetchUtil call
      const mockForm = {
        password: 'mockPassword',
        token: 'mockToken',
        hostname: 'mockHostname',
      };
      expectSaga(pushSystemKeys, {})
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
          url: `/api/accounts/systems/${action.payload.systemId}/keys/`,
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
      // Check for action.payload.onSuccess
      expect(action.payload).toBe(onSuccess);
    };
});
