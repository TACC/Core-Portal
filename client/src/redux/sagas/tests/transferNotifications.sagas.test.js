import { runSaga } from 'redux-saga';
import { handleSocket } from '../notifications.sagas';

const notification = {
  event_type: 'data_files',
  operation: 'copy',
  status: 'SUCCESS',
  message: 'File copied to shared',
  extra: {
    transfer_complete: true,
    response: { systemId: 'workspace', path: '/shared/file.txt' },
  },
};
const current = {
  api: 'tapis',
  scheme: 'projects',
  system: 'workspace',
  path: 'shared/',
};

async function receive(action, listing = current, modal = {}) {
  const actions = [];
  await runSaga(
    {
      dispatch: (event) => actions.push(event),
      getState: () => ({ files: { params: { FilesListing: listing, modal } } }),
    },
    handleSocket,
    action
  ).toPromise();
  return actions;
}

async function receiveMany(actionsToReceive, listing = current, modal = {}) {
  const actions = [];
  await Promise.all(
    actionsToReceive.map((action) =>
      runSaga(
        {
          dispatch: (event) => actions.push(event),
          getState: () => ({
            files: { params: { FilesListing: listing, modal } },
          }),
        },
        handleSocket,
        action
      ).toPromise()
    )
  );
  return actions;
}

it('toasts and refreshes the open destination, normalizing slashes', async () => {
  const actions = await receive(notification, current, current);
  expect(actions.map((a) => a.type).sort()).toEqual([
    'ADD_TOAST',
    'FETCH_FILES',
    'FETCH_FILES_MODAL',
  ]);
  expect(actions.find((a) => a.type === 'FETCH_FILES').payload).toMatchObject({
    ...current,
    section: 'FilesListing',
    limit: 100,
  });
});
it('does not change a different folder or storage system', async () => {
  expect(
    await receive(notification, { ...current, path: 'elsewhere' })
  ).toEqual([
    {
      type: 'ADD_TOAST',
      payload: {
        ...notification,
        extra: { ...notification.extra, copy_count: 1 },
      },
    },
  ]);
  expect(
    await receive(notification, { ...current, system: 'my-data' })
  ).toHaveLength(1);
});
it('refreshes root destinations', async () => {
  const action = {
    ...notification,
    extra: {
      transfer_complete: true,
      response: { systemId: 'workspace', path: 'file.txt' },
    },
  };
  expect(
    (await receive(action, { ...current, path: '/' })).some(
      (event) => event.type === 'FETCH_FILES'
    )
  ).toBe(true);
});
it('aggregates completed copy toasts for the same destination', async () => {
  const actions = await receiveMany([
    notification,
    {
      ...notification,
      extra: {
        ...notification.extra,
        response: { systemId: 'workspace', path: '/shared/second.txt' },
      },
    },
    {
      ...notification,
      extra: {
        ...notification.extra,
        response: { systemId: 'workspace', path: '/shared/third.txt' },
      },
    },
  ]);
  expect(actions.filter((a) => a.type === 'ADD_TOAST')).toEqual([
    {
      type: 'ADD_TOAST',
      payload: expect.objectContaining({
        extra: expect.objectContaining({ copy_count: 3 }),
      }),
    },
  ]);
  expect(actions.filter((a) => a.type === 'FETCH_FILES')).toHaveLength(3);
});
it('does not refresh on failure or unrelated file notifications', async () => {
  expect(await receive({ ...notification, status: 'ERROR' })).toHaveLength(1);
  expect(await receive({ ...notification, extra: {} })).toHaveLength(1);
});
