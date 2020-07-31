import React from 'react';
import { Badge } from 'reactstrap';
import PropTypes from 'prop-types';
import JobsSessionModal from '../JobsSessionModal';
import './JobsStatus.module.scss';

const STATUS_TEXT_MAP = {
  ACCEPTED: 'Processing',
  PENDING: 'Processing',
  PROCESSING_INPUTS: 'Processing',
  STAGING_INPUTS: 'Staging',
  STAGED: 'Staging',
  STAGING_JOB: 'Staging',
  SUBMITTING: 'Submitted',
  QUEUED: 'Queued',
  RUNNING: 'Running',
  CLEANING_UP: 'Running',
  ARCHIVING: 'Running',
  FINISHED: 'Finished',
  STOPPED: 'Stopped',
  FAILED: 'Failure',
  BLOCKED: 'Blocked',
  PAUSED: 'Paused'
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

function JobsStatus({ status, fancy }) {
  const [modal, setModal] = React.useState(false);
  const toggleModal = () => {
    setModal(!modal);
  };
  const color = getBadgeColor(status);
  const userStatus = getStatusText(status);

  // TODO: Make this accurate
  const isRunning = status === 'FINISHED';
  return (
    <>
      {fancy && color ? (
        <Badge color={color}>{userStatus}</Badge>
      ) : (
        <span>{userStatus}</span>
      )}
      {/* Check if job is running AND has interactive session */}
      {isRunning && (
        <>
          <button type="button" styleName="open-button" onClick={toggleModal}>
            <i className="icon icon-new-browser" styleName="open-icon" />
            Open Session
          </button>
          <JobsSessionModal toggle={toggleModal} isOpen={modal} />
        </>
      )}
    </>
  );
}

JobsStatus.propTypes = {
  status: PropTypes.string,
  fancy: PropTypes.bool
};
JobsStatus.defaultProps = { status: '', fancy: false };

export default JobsStatus;
