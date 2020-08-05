import { Badge } from 'reactstrap';
import React from 'react';
import PropTypes from 'prop-types';
import './Jobs.module.scss';

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
    const mappedStatus = this[status];
    switch (mappedStatus) {
      case 'Running':
        return 'is now running';
      case 'Failure' || 'Stopped':
        return status.toLowerCase();
      case 'Finished':
        return 'finished successfully';
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

function JobsStatus({ status, fancy }) {
  const color = getBadgeColor(status);
  const userStatus = getStatusText(status);
  if (fancy && color) {
    return (
      <Badge color={color} styleName="badge">
        {userStatus}
      </Badge>
    );
  }
  return userStatus;
}

JobsStatus.propTypes = {
  status: PropTypes.string,
  fancy: PropTypes.bool
};

export default JobsStatus;
