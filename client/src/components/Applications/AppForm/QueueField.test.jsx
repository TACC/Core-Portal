import React from 'react';
import { act, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Formik } from 'formik';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import systemMonitor from '../../../redux/reducers/systemMonitor.reducers';
import QueueField from './QueueField';

const warning = /This queue is at least 90% full/;
const hostname = 'vista.tacc.utexas.edu';
const systems = (load) => [
  {
    hostname,
    queues: [
      { name: 'gh', load },
      { name: 'gg', load: 0.5 },
    ],
  },
  { hostname: 'frontera.tacc.utexas.edu', queues: [{ name: 'gh', load: 0.1 }] },
];
const makeStore = (list = []) =>
  createStore(
    (state, action) => ({
      systemMonitor: systemMonitor(state?.systemMonitor, action),
    }),
    { systemMonitor: { list } }
  );
const field = (store, host = hostname, queueName = 'gh') => (
  <Provider store={store}>
    <Formik
      initialValues={{ execSystemLogicalQueue: queueName }}
      onSubmit={() => {}}
    >
      <QueueField hostname={host} queueName={queueName}>
        <option value="gh">gh</option>
        <option value="gg">gg</option>
      </QueueField>
    </Formik>
  </Provider>
);

it.each([0.9, 0.99, 1])(
  'warns at load %s without disabling selection',
  (load) => {
    render(field(makeStore(systems(load))));
    expect(screen.getByText(warning)).toBeVisible();
    expect(screen.getByText(warning)).toHaveClass('alert-warning');
    expect(screen.getByRole('combobox')).toBeEnabled();
  }
);

it.each([0.8999, 0, null, undefined])('does not warn for load %s', (load) => {
  render(field(makeStore(systems(load))));
  expect(screen.queryByText(warning)).not.toBeInTheDocument();
});

it('uses the selected system and queue', () => {
  const store = makeStore(systems(0.95));
  const { rerender } = render(field(store));
  expect(screen.getByText(warning)).toBeVisible();
  for (const [host, queue] of [
    [hostname, 'gg'],
    [hostname, 'unknown'],
    ['frontera.tacc.utexas.edu', 'gh'],
    ['cluster.example.com', 'gh'],
    [null, 'gh'],
  ]) {
    rerender(field(store, host, queue));
    expect(screen.queryByText(warning)).not.toBeInTheDocument();
  }
});

it('updates when shared monitor data arrives and is refreshed', () => {
  const store = makeStore();
  render(field(store));
  expect(screen.queryByText(warning)).not.toBeInTheDocument();
  act(() =>
    store.dispatch({ type: 'SYSTEM_MONITOR_SUCCESS', payload: systems(0.95) })
  );
  expect(screen.getByText(warning)).toBeVisible();
  act(() =>
    store.dispatch({ type: 'SYSTEM_MONITOR_SUCCESS', payload: systems(0.5) })
  );
  expect(screen.queryByText(warning)).not.toBeInTheDocument();
});

it('leaves selection usable when monitor data is unavailable', () => {
  render(field(makeStore([{ hostname }])));
  expect(screen.queryByText(warning)).not.toBeInTheDocument();
  expect(screen.getByRole('combobox')).toBeEnabled();
});
