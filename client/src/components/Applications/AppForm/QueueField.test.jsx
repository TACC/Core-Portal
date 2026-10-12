import React from 'react';
import { act, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Formik } from 'formik';
import { vi } from 'vitest';
import { useSystemQueue } from 'hooks/system-monitor/useSystemMonitor';
import QueueField from './QueueField';

vi.mock('hooks/system-monitor/useSystemMonitor', () => ({
  useSystemQueue: vi.fn(),
}));
beforeEach(() => vi.resetAllMocks());

const warning = /This queue is at least 90% full/;
const hostname = 'vista.tacc.utexas.edu';
const field = (host = hostname, queueName = 'gh') => (
  <Formik
    initialValues={{ execSystemLogicalQueue: queueName }}
    onSubmit={() => {}}
  >
    <QueueField hostname={host} queueName={queueName}>
      <option value="gh">gh</option>
      <option value="gg">gg</option>
    </QueueField>
  </Formik>
);

it.each([0.9, 0.99, 1])(
  'warns at load %s without disabling selection',
  async (load) => {
    useSystemQueue.mockResolvedValue([{ name: 'gh', load }]);
    render(field());
    expect(await screen.findByText(warning)).toHaveClass('alert-warning');
    expect(screen.getByRole('combobox')).toBeEnabled();
    expect(useSystemQueue).toHaveBeenCalledExactlyOnceWith(hostname);
  }
);

it.each([0.8999, 0, null, undefined])(
  'does not warn for load %s',
  async (load) => {
    useSystemQueue.mockResolvedValue([{ name: 'gh', load }]);
    await act(async () => render(field()));
    expect(screen.queryByText(warning)).not.toBeInTheDocument();
  }
);

it('changes queues without fetching the same system again', async () => {
  useSystemQueue.mockResolvedValue([
    { name: 'gh', load: 1 },
    { name: 'gg', load: 0.5 },
  ]);
  const { rerender } = render(field());
  await screen.findByText(warning);
  rerender(field(hostname, 'gg'));
  expect(screen.queryByText(warning)).not.toBeInTheDocument();
  rerender(field(hostname, 'unknown'));
  expect(screen.queryByText(warning)).not.toBeInTheDocument();
  expect(useSystemQueue).toHaveBeenCalledTimes(1);
});

it('clears a warning while another system is loading', async () => {
  let resolveNext;
  useSystemQueue
    .mockResolvedValueOnce([{ name: 'gh', load: 1 }])
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveNext = resolve;
        })
    );
  const { rerender } = render(field());
  await screen.findByText(warning);
  rerender(field('frontera.tacc.utexas.edu'));
  expect(screen.queryByText(warning)).not.toBeInTheDocument();
  expect(useSystemQueue).toHaveBeenLastCalledWith('frontera.tacc.utexas.edu');
  await act(async () => resolveNext([{ name: 'gh', load: 0.95 }]));
  expect(screen.getByText(warning)).toBeVisible();
});

it('ignores a delayed response from a previously selected system', async () => {
  let resolveOld;
  useSystemQueue
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveOld = resolve;
        })
    )
    .mockResolvedValueOnce([{ name: 'gh', load: 0.1 }]);
  const { rerender } = render(field());
  await act(async () => rerender(field('frontera.tacc.utexas.edu')));
  await act(async () => resolveOld([{ name: 'gh', load: 1 }]));
  expect(screen.queryByText(warning)).not.toBeInTheDocument();
});

it('leaves selection usable when the request fails', async () => {
  useSystemQueue.mockRejectedValue(new Error('Unavailable'));
  await act(async () => render(field()));
  expect(screen.queryByText(warning)).not.toBeInTheDocument();
  expect(screen.getByRole('combobox')).toBeEnabled();
});

it.each([null, {}, []])('ignores unavailable queue data: %s', async (data) => {
  useSystemQueue.mockResolvedValue(data);
  await act(async () => render(field()));
  expect(screen.queryByText(warning)).not.toBeInTheDocument();
});

it.each([null, '', 'cluster.example.com'])(
  'skips unsupported host %s and clears previous warnings',
  async (host) => {
    useSystemQueue.mockResolvedValue([{ name: 'gh', load: 1 }]);
    const { rerender } = render(field());
    await screen.findByText(warning);
    rerender(field(host));
    expect(screen.queryByText(warning)).not.toBeInTheDocument();
    expect(useSystemQueue).toHaveBeenCalledTimes(1);
  }
);
