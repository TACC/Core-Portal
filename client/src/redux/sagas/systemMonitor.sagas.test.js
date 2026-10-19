import { runSaga } from 'redux-saga';
import { vi } from 'vitest';
import { fetchUtil } from 'utils/fetchUtil';
import { getSystemMonitor } from './systemMonitor.sagas';

vi.mock('utils/fetchUtil', () => ({ fetchUtil: vi.fn() }));
beforeEach(() => vi.resetAllMocks());

it('fetches only system summaries and sorts them by name', async () => {
  const vista = { display_name: 'Vista', hostname: 'vista.tacc.utexas.edu' };
  const frontera = {
    display_name: 'Frontera',
    hostname: 'frontera.tacc.utexas.edu',
  };
  fetchUtil.mockResolvedValue([vista, frontera]);
  const dispatch = vi.fn();
  await runSaga({ dispatch }, getSystemMonitor).toPromise();
  expect(fetchUtil).toHaveBeenCalledExactlyOnceWith({
    url: '/api/system-monitor/',
  });
  expect(dispatch.mock.calls).toEqual([
    [{ type: 'SYSTEM_MONITOR_LOAD' }],
    [{ type: 'SYSTEM_MONITOR_SUCCESS', payload: [frontera, vista] }],
  ]);
});

it('reports a failed summary request', async () => {
  const error = new Error('Unavailable');
  fetchUtil.mockRejectedValue(error);
  const dispatch = vi.fn();
  await runSaga({ dispatch }, getSystemMonitor).toPromise();
  expect(dispatch).toHaveBeenLastCalledWith({
    type: 'SYSTEM_MONITOR_ERROR',
    payload: error,
  });
});
