import React from 'react';
import { useSelector } from 'react-redux';
import { Badge } from 'reactstrap';
import PropTypes from 'prop-types';
import { Icon } from '_common';
import JobsSessionModal from '../JobsSessionModal';
import './JobsStatus.module.scss';

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

  /* Check if job is running AND has interactive session */
  const jobConcluded = [
    'CLEANING_UP',
    'ARCHIVING',
    'FINISHED',
    'STOPPED',
    'FAILED'
  ];
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
    <div styleName="root">
      {fancy && color ? (
        <Badge color={color}>{userStatus}</Badge>
      ) : (
        <span>{userStatus}</span>
      )}
      {interactiveSessionLink && (
        <>
          <button type="button" styleName="open-button" onClick={toggleModal}>
            <Icon name="new-browser" styleName="open-icon" />
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
