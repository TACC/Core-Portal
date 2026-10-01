import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import useCopy from './useCopy';

const { dispatch, mutateAsync, selected } = vi.hoisted(() => ({
  dispatch: vi.fn(),
  mutateAsync: vi.fn(),
  selected: [
    { id: 'one', name: 'one.txt', system: 'my-data', path: '/one.txt' },
    { id: 'two', name: 'two.txt', system: 'my-data', path: '/two.txt' },
  ],
}));
vi.mock('react-redux', () => ({
  shallowEqual: vi.fn(),
  useDispatch: () => dispatch,
  useSelector: (selector: any) =>
    selector({
      files: {
        operationStatus: { copy: {} },
        params: { FilesListing: { scheme: 'private' } },
      },
    }),
}));
vi.mock('hooks/datafiles', () => ({
  useSelectedFiles: () => ({ selectedFiles: selected }),
}));
vi.mock('@tanstack/react-query', () => ({
  useMutation: () => ({ mutateAsync }),
}));

const options = {
  srcApi: 'tapis',
  destApi: 'tapis',
  destSystem: 'workspace',
  destPath: '/shared',
  name: 'Shared Workspace',
  callback: vi.fn(),
};
beforeEach(() => {
  vi.clearAllMocks();
  selected.splice(
    0,
    selected.length,
    { id: 'one', name: 'one.txt', system: 'my-data', path: '/one.txt' },
    { id: 'two', name: 'two.txt', system: 'my-data', path: '/two.txt' }
  );
});

it('announces acceptance without reporting success or refreshing before completion', async () => {
  mutateAsync.mockResolvedValue({ data: { pending: true, uuid: 'transfer' } });
  const { result } = renderHook(useCopy);
  await result.current.copy(options);
  const actions = dispatch.mock.calls.map(([action]) => action);
  expect(actions.filter((a) => a.payload?.status === 'ACCEPTED')).toHaveLength(
    2
  );
  expect(actions.filter((a) => a.type === 'ADD_TOAST')).toEqual([
    {
      type: 'ADD_TOAST',
      payload: {
        status: 'INFO',
        message:
          'Copy started for 2 files. You will be notified when complete.',
      },
    },
  ]);
  expect(
    actions.filter((a) => a.type === 'DATA_FILES_TOGGLE_MODAL')
  ).toHaveLength(1);
  expect(options.callback).not.toHaveBeenCalled();
});

it('keeps synchronous copy success and refresh behavior', async () => {
  mutateAsync.mockResolvedValue({ data: {} });
  const { result } = renderHook(useCopy);
  await result.current.copy(options);
  expect(dispatch).toHaveBeenCalledWith({
    type: 'ADD_TOAST',
    payload: { message: 'Files copied to /shared' },
  });
  expect(options.callback).toHaveBeenCalledOnce();
});

it('uses singular copy success text for one file', async () => {
  selected.splice(1);
  mutateAsync.mockResolvedValue({ data: {} });
  const { result } = renderHook(useCopy);
  await result.current.copy(options);
  expect(dispatch).toHaveBeenCalledWith({
    type: 'ADD_TOAST',
    payload: { message: 'File copied to /shared' },
  });
});

it('handles partial failure without an unhandled rejection or closing the modal', async () => {
  mutateAsync
    .mockResolvedValueOnce({ data: { pending: true } })
    .mockRejectedValueOnce(new Error('failed'));
  const { result } = renderHook(useCopy);
  await result.current.copy(options);
  expect(dispatch).toHaveBeenCalledWith({
    type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
    payload: { operation: 'copy', key: 'two', status: 'ERROR' },
  });
  expect(
    dispatch.mock.calls.some(([a]) => a.type === 'DATA_FILES_TOGGLE_MODAL')
  ).toBe(false);
  expect(options.callback).not.toHaveBeenCalled();
});
