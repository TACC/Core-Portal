import { runSaga } from 'redux-saga';
import { vi } from 'vitest';
import { fetchUtil } from 'utils/fetchUtil';
import { getSystemMonitor } from './systemMonitor.sagas';

vi.mock('utils/fetchUtil', () => ({ fetchUtil: vi.fn() }));

beforeEach(() => vi.resetAllMocks());

it('stores queues with their system summaries', async () => {
  const system = { display_name: 'Vista', hostname: 'vista.tacc.utexas.edu' };
  const queues = [{ name: 'gh', load: 0.95 }];
  fetchUtil.mockResolvedValueOnce([system]).mockResolvedValueOnce(queues);
  const dispatch = vi.fn();
  await runSaga({ dispatch }, getSystemMonitor).toPromise();
  expect(dispatch).toHaveBeenNthCalledWith(2, {
    type: 'SYSTEM_MONITOR_SUCCESS',
    payload: [system],
  });
  expect(fetchUtil).toHaveBeenNthCalledWith(2, {
    url: '/api/system-monitor/vista.tacc.utexas.edu',
  });
  expect(dispatch).toHaveBeenLastCalledWith({
    type: 'SYSTEM_MONITOR_SUCCESS',
    payload: [{ ...system, queues }],
  });
});

it('preserves summaries and other queues if a queue request fails', async () => {
  const systems = [
    { display_name: 'Frontera', hostname: 'frontera.tacc.utexas.edu' },
    { display_name: 'Vista', hostname: 'vista.tacc.utexas.edu' },
  ];
  const queues = [{ name: 'gh', load: 0.95 }];
  fetchUtil
    .mockResolvedValueOnce(systems)
    .mockRejectedValueOnce(new Error('Unavailable'))
    .mockResolvedValueOnce(queues);
  const dispatch = vi.fn();
  await runSaga({ dispatch }, getSystemMonitor).toPromise();
  expect(dispatch).toHaveBeenLastCalledWith({
    type: 'SYSTEM_MONITOR_SUCCESS',
    payload: [
      { ...systems[0], queues: [] },
      { ...systems[1], queues },
    ],
  });
});
