import React from 'react';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { toHaveClass } from '@testing-library/jest-dom/dist/matchers';
import JobsStatus, {
  getStatusText,
  getBadgeColor,
  STATUS_TEXT_MAP,
} from './JobsStatus';
import { initialState as notifications } from '../../../redux/reducers/notifications.reducers';

const mockStore = configureStore();

function renderJobsStatus(store, props) {
  return render(
    <Provider store={store}>
      <JobsStatus {...props} jobUuid="1234-5678-90AZ" />
    </Provider>
  );
}

//expect.extend({ toHaveClass });
describe('JobsStatus', () => {
  it('converts status to proper UI strings', () => {
    expect(getStatusText('PENDING')).toEqual('Processing');
    expect(getStatusText('PROCESSING_INPUTS')).toEqual('Processing');
    expect(getStatusText('STAGING_INPUTS')).toEqual('Queueing');
    expect(getStatusText('STAGING_JOB')).toEqual('Queueing');
    expect(getStatusText('SUBMITTING_JOB')).toEqual('Queueing');
    expect(getStatusText('QUEUED')).toEqual('Queueing');
    expect(getStatusText('RUNNING')).toEqual('Running');
    expect(getStatusText('ARCHIVING')).toEqual('Finishing');
    expect(getStatusText('FINISHED')).toEqual('Finished');
    expect(getStatusText('STOPPED')).toEqual('Stopped');
    expect(getStatusText('FAILED')).toEqual('Failure');
    expect(getStatusText('BLOCKED')).toEqual('Blocked');
    expect(getStatusText('PAUSED')).toEqual('Paused');
    expect(getStatusText('CANCELLED')).toEqual('Cancelled');
    expect(getStatusText('random_status')).toEqual('Unknown');
  });

  it('gets badge color for job status', () => {
    expect(getBadgeColor('FAILED')).toEqual('danger');
    expect(getBadgeColor('FINISHED')).toEqual('success');
    expect(getBadgeColor('STOPPED')).toEqual('warning');
    expect(getBadgeColor('BLOCKED')).toEqual('warning');
    expect(getBadgeColor('RUNNING')).toEqual(null);
  });

  it('renders Finished', () => {
    const { getByText } = renderJobsStatus(mockStore({ notifications }), {
      status: 'FINISHED',
      fancy: false,
    });
    expect(getByText(/Finished/)).toBeDefined();
  });

  it('renders Finished with success badge', () => {
    const { getByText } = renderJobsStatus(mockStore({ notifications }), {
      status: 'FINISHED',
      fancy: true,
    });
    expect(getByText(/Finished/)).toBeDefined();
  });

  it.each(Object.keys(STATUS_TEXT_MAP))(
    'correctly does or does not render interactive session button when status is %s',
    () => {
      const jobConcluded = [
        'CLEANING_UP',
        'ARCHIVING',
        'FINISHED',
        'STOPPED',
        'FAILED',
      ];

      const jobNotifs = {
        notifications: {
          ...notifications,
          list: {
            notifs: [
              {
                event_type: 'interactive_session_ready',
                extra: { status, uuid: '1234-5678-90AZ' },
                action_link: 'https://test',
              },
            ],
          },
        },
      };
      const { getByTestId } = renderJobsStatus(mockStore(jobNotifs), {
        status,
        fancy: true,
      });
      const interactiveButton = getByTestId('interactive-session-button');
      if (!jobConcluded.includes(status)) {
        expect(interactiveButton).toBeDefined();
        expect(interactiveButton).toHaveTextContent(/Open Session/);
      } else {
        expect(interactiveButton).not.toBeInTheDocument();
        expect(interactiveButton).toBeUndefined();
      }
    }
  );
});
