import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import '@testing-library/jest-dom/extend-expect';
import NotificationToast, { getToastMessage } from './Toast';
import { initialState as notifications } from '../../redux/reducers/notifications.reducers';
import { initialSystemState } from '../../redux/reducers/datafiles.reducers';
import { dataFilesRename, dataFilesError } from '../../redux/sagas/fixtures/notificationsDataFilesEvents.fixture';
import { jobStatusUpdatePending, jobInteractiveSessionReady } from '../../redux/sagas/fixtures/notificationsJobsEvents.fixture';

const mockStore = configureStore();

const exampleToasts = [
  {
    pk: '1',
    event_type: 'job',
    message: 'This is a test message',
    extra: {
      name: 'RStudio-Stampede2-1.1.423u4_2020-08-04T22:55:35-dcvserver',
      status: 'RUNNING',
    },
  },
  {
    pk: '2',
    event_type: 'job',
    message: 'This is another test message',
    extra: {
      name: 'RStudio-Stampede2-1.1.423u4_2020-08-04T22:55:35-dcvserver',
      status: 'FINISHED',
    },
  },
];

function renderToastComponent(store) {
  return render(
    <Provider store={store}>
      <NotificationToast />
    </Provider>
  );
}

describe('Notification Toast', () => {
  it('shows no toast on init', () => {
    const { queryByRole } = renderToastComponent(
      mockStore({ notifications: notifications, systems: initialSystemState })
    );
    expect(queryByRole('alert')).toBeNull();
  });

  it('shows first toast in array', () => {
    const { queryByRole } = renderToastComponent(
      mockStore({
        systems: initialSystemState,
        notifications: {
          ...notifications,
          list: {
            ...notifications.list,
            toasts: exampleToasts,
          },
        },
        projects: {
          listing: {
            projects: []
          }
        }
      })
    );
    expect(queryByRole('alert')).toBeDefined();
    expect(queryByRole('alert')).toHaveTextContent(/RStudio-S...cvserver is now running/);
    expect(queryByRole('alert')).not.toHaveTextContent(/RStudio-S...cvserver finished successfully/);
  });
});

describe('getToastMessage', () => {
  it('returns expected job response', () => {
    expect(getToastMessage(jobStatusUpdatePending)).toEqual('RStudio-S...cvserver is processing');
  });

  it('returns expected interactive_session_ready response', () => {
    expect(getToastMessage(jobInteractiveSessionReady)).toEqual('RStudio-S...cvserver ready to view.');
  });

  it('returns expected data_files responses', () => {
    expect(getToastMessage(dataFilesRename)).toEqual('File renamed to test2.png');
    expect(getToastMessage(dataFilesError)).toEqual('Move failed');
  });

});
