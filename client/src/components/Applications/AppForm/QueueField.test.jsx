import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Formik } from 'formik';
import { vi } from 'vitest';
import { fetchUtil } from 'utils/fetchUtil';
import QueueField from './QueueField';

vi.mock('utils/fetchUtil', () => ({ fetchUtil: vi.fn() }));

const warning = /This queue is at least 90% full/;
const field = (hostname = 'vista.tacc.utexas.edu', queueName = 'gh') => (
  <Formik
    initialValues={{ execSystemLogicalQueue: queueName }}
    onSubmit={() => {}}
  >
    <QueueField hostname={hostname} queueName={queueName}>
      <option value="gh">gh</option>
      <option value="gg">gg</option>
    </QueueField>
  </Formik>
);

beforeEach(() => vi.clearAllMocks());

it.each([0.9, 0.99, 1])(
  'warns at load %s without disabling selection',
  async (load) => {
    fetchUtil.mockResolvedValue([{ name: 'gh', load }]);
    render(field());
    expect(await screen.findByText(warning)).toBeVisible();
    expect(screen.getByRole('combobox')).toBeEnabled();
  }
);

it.each([0.8999, 0, null, undefined, '0.95', NaN])(
  'does not warn for load %s',
  async (load) => {
    fetchUtil.mockResolvedValue([{ name: 'gh', load }]);
    await act(async () => render(field()));
    expect(screen.queryByText(warning)).not.toBeInTheDocument();
  }
);

it('updates for the selected queue without fetching the same system again', async () => {
  fetchUtil.mockResolvedValue([
    { name: 'gh', load: 0.95 },
    { name: 'gg', load: 0.5 },
  ]);
  const { rerender } = render(field());
  await screen.findByText(warning);
  rerender(field('vista.tacc.utexas.edu', 'gg'));
  expect(screen.queryByText(warning)).not.toBeInTheDocument();
  rerender(field('vista.tacc.utexas.edu', 'unknown'));
  expect(screen.queryByText(warning)).not.toBeInTheDocument();
  expect(fetchUtil).toHaveBeenCalledTimes(1);
});

it('discards a delayed response after switching systems', async () => {
  let resolveOld;
  fetchUtil.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveOld = resolve;
      })
  );
  fetchUtil.mockResolvedValueOnce([{ name: 'gh', load: 0.1 }]);
  const { rerender } = render(field());
  rerender(field('frontera.tacc.utexas.edu'));
  await waitFor(() => expect(fetchUtil).toHaveBeenCalledTimes(2));
  await act(async () => resolveOld([{ name: 'gh', load: 1 }]));
  expect(screen.queryByText(warning)).not.toBeInTheDocument();
  expect(fetchUtil.mock.calls[0][0].signal.aborted).toBe(true);
});

it('clears a previous warning when changing systems', async () => {
  fetchUtil.mockResolvedValueOnce([{ name: 'gh', load: 1 }]);
  fetchUtil.mockResolvedValueOnce([]);
  const { rerender } = render(field());
  await screen.findByText(warning);
  await act(async () => rerender(field('frontera.tacc.utexas.edu')));
  expect(screen.queryByText(warning)).not.toBeInTheDocument();
});

it.each([null, {}, []])(
  'ignores missing or malformed queue data: %s',
  async (data) => {
    fetchUtil.mockResolvedValue(data);
    await act(async () => render(field()));
    expect(screen.queryByText(warning)).not.toBeInTheDocument();
  }
);

it('leaves the queue usable if the status request fails', async () => {
  fetchUtil.mockRejectedValue(new Error('Unavailable'));
  await act(async () => render(field()));
  expect(screen.queryByText(warning)).not.toBeInTheDocument();
  expect(screen.getByRole('combobox')).toBeEnabled();
});

it.each([null, '', 'cluster.example.com'])(
  'skips systems without a TACC host: %s',
  async (hostname) => {
    await act(async () => render(field(hostname, 'gh')));
    expect(fetchUtil).not.toHaveBeenCalled();
  }
);
