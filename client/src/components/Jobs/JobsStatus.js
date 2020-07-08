import { Badge } from 'reactstrap';
import React from 'react';
import PropTypes from 'prop-types';

export function getStatusText(status) {
  switch (status) {
    case 'ACCEPTED':
      return 'Accepted';
    case 'PENDING':
      return 'Pending';
    case 'PROCESSING_INPUTS':
      return 'Processing';
    case 'STAGING_INPUTS':
      return 'Staging Inputs';
    case 'STAGED':
      return 'Staged';
    case 'STAGING_JOB':
      return 'Staging Job';
    case 'SUBMITTING':
      return 'Submitted';
    case 'QUEUED':
      return 'Queued';
    case 'RUNNING':
      return 'Running';
    case 'CLEANING_UP':
      return 'Cleaning Up';
    case 'ARCHIVING':
      return 'Archiving';
    case 'FINISHED':
      return 'Finished';
    case 'STOPPED':
      return 'Stopped';
    case 'FAILED':
      return 'Failure';
    case 'BLOCKED':
      return 'Blocked';
    default:
      return 'Unknown';
  }
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
    return <Badge color={color}>{userStatus}</Badge>;
  }
  return userStatus;
}

JobsStatus.propTypes = {
  status: PropTypes.string,
  fancy: PropTypes.bool
};

export default JobsStatus;
