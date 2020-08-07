import React from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import PropTypes from 'prop-types';
import JobsView from '../../Jobs';

const JobHistory = ({ className }) => {
  const { notifs } = useSelector(
    state => state.notifications.list,
    shallowEqual
  );
  const unreadIds = notifs
    .filter(n => !n.read && n.event_type === 'job')
    .map(n => n.extra.id);
  const rowProps = row => {
    return {
      className: unreadIds.includes(row.original.id) ? 'highlight' : ''
    };
  };

  return (
    <JobsView
      className={className}
      showDetails
      showFancyStatus
      rowProps={rowProps}
    />
  );
};
JobHistory.propTypes = {
  /** Additional className for the root element */
  className: PropTypes.string
};
JobHistory.defaultProps = {
  className: ''
};

export default JobHistory;
