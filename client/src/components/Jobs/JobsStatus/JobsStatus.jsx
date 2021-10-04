import React from 'react';
import { useSelector } from 'react-redux';
import { Badge } from 'reactstrap';
import PropTypes from 'prop-types';
import { Icon } from '_common';
import JobsSessionModal from '../JobsSessionModal';
import styles from './JobsStatus.module.scss';

export const STATUS_TEXT_MAP = {
  ACCEPTED: 'Processing',
  PENDING: 'Processing',
  PROCESSING_INPUTS: 'Processing',
  STAGING_INPUTS: 'Staging',
  STAGED: 'Staging',
  STAGING_JOB: 'Staging',
  SUBMITTING: 'Submitted',
  QUEUED: 'Queued',
  RUNNING: 'Running',
  CLEANING_UP: 'Finishing',
  ARCHIVING: 'Finishing',
  FINISHED: 'Finished',
  STOPPED: 'Stopped',
  FAILED: 'Failure',
  BLOCKED: 'Blocked',
  PAUSED: 'Paused',
  toastMap(status) {
    /* Post-process mapped status message to get a toast message translation. */
    const mappedStatus = getStatusText(status);
    switch (mappedStatus) {
      case 'Running':
        return 'is now running';
      case 'Failure' || 'Stopped':
        return status.toLowerCase();
      case 'Finished':
        return 'finished successfully';
      case 'Unknown':
        return 'is in an unknown state';
      default:
        return `is ${mappedStatus.toLowerCase()}`;
    }
  }
};

export function getStatusText(status) {
  if (status in STATUS_TEXT_MAP) {
    return STATUS_TEXT_MAP[status];
  }
  return 'Unknown';
}

export function getBadgeColor(status) {
  switch (status) {
    case 'FAILED':
      return 'danger';
    case 'FINISHED':
      return 'success';
    case 'STOPPED':
    case 'BLOCKED':
      return 'warning';
    default:
      return null;
  }
}

function JobsStatus({ status, fancy, jobId }) {
  const [modal, setModal] = React.useState(false);
  const toggleModal = () => {
    setModal(!modal);
  };
  const color = getBadgeColor(status);
  const userStatus = getStatusText(status);

  const notifs = useSelector(state => state.notifications.list.notifs);
  let interactiveSessionLink;

  const jobConcluded = [
    'CLEANING_UP',
    'ARCHIVING',
    'FINISHED',
    'STOPPED',
    'FAILED'
  ];

  /* Check if job is not ended AND has interactive session. */
  /* NOTE: Sometimes a job RUNNING status and the interactive webhook come out of order,
  so instead of checking for a running job with a session, we check that the job is not ended.
  */
  if (!jobConcluded.includes(status)) {
    const interactiveNotifs = notifs.filter(
      n =>
        n.event_type === 'interactive_session_ready' &&
        !jobConcluded.includes(n.extra.status) // need to account for the possibility of session ready and job status notifs coming out of order
    );
    const notif = interactiveNotifs.find(n => n.extra.id === jobId);
    interactiveSessionLink = notif ? notif.action_link : null;
  }

  return (
    <div className={styles.root}>
      {fancy && color ? (
        <Badge color={color}>{userStatus}</Badge>
      ) : (
        <span>{userStatus}</span>
      )}
      {interactiveSessionLink && (
        <>
          <button
            type="button"
            className={styles['open-button']}
            onClick={toggleModal}
            data-testid="interactive-session-button"
          >
            <Icon name="new-browser" className={styles['open-icon']} />
            Open Session
          </button>
          <JobsSessionModal
            toggle={toggleModal}
            isOpen={modal}
            interactiveSessionLink={interactiveSessionLink}
          />
        </>
      )}
    </div>
  );
}

JobsStatus.propTypes = {
  status: PropTypes.string.isRequired,
  fancy: PropTypes.bool,
  jobId: PropTypes.string.isRequired
};
JobsStatus.defaultProps = {
  fancy: false
};

export default JobsStatus;
