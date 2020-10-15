import React from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import PropTypes from 'prop-types';

import { LoadingSpinner, SectionTable } from '_common';
import JobsView from '../../Jobs';

import './HistoryViews.scss';

const JobHistory = ({ className }) => {
  const { notifs, loading } = useSelector(
    state => ({
      notifs: state.notifications.list.notifs,
      loading: state.notifications.loading
    }),
    shallowEqual
  );
  const unreadIds = notifs
    .filter(n => !n.read && n.event_type === 'job')
    .map(n => n.extra.id);
  const rowProps = row => {
    return {
      className: unreadIds.includes(row.original.id) ? 'unread' : ''
    };
  };

  return (
    <SectionTable className={`job-history ${className}`} shouldScroll>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <JobsView showDetails showFancyStatus rowProps={rowProps} />
      )}
    </SectionTable>
  );
};
JobHistory.propTypes = {
  /** Any additional className(s) for the root element */
  className: PropTypes.string
};
JobHistory.defaultProps = {
  className: ''
};

export default JobHistory;
