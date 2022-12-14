import React from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';

import { LoadingSpinner, SectionTableWrapper } from '_common';
import JobsView from '../../Jobs';

import './JobHistory.module.scss';
import './HistoryViews.scss';

const JobHistory = ({ className }) => {
  const { notifs, loading } = useSelector(
    (state) => ({
      notifs: state.notifications.list.notifs,
      loading: state.notifications.loading,
    }),
    shallowEqual
  );
  const location = useLocation();
  const version = location.pathname.includes('jobsv2') ? 'v2' : 'v3';
  const unreadIds = notifs
    .filter((n) => !n.read && n.event_type === 'job')
    .map((n) => n.extra.id);
  const rowProps = (row) => {
    return {
      className: unreadIds.includes(row.original.id) ? 'unread' : '',
    };
  };

  return (
    /* CLEVER: Using `job-history` class to scope the `unread` className */
    /* FP-936: Use 'unread' class from CSS Modules stylesheet, not global one */
    <SectionTableWrapper
      className={`job-history ${className}`}
      contentShouldScroll
    >
      {loading ? (
        <LoadingSpinner />
      ) : (
        <JobsView
          showDetails
          showFancyStatus
          rowProps={rowProps}
          version={version}
        />
      )}
    </SectionTableWrapper>
  );
};
JobHistory.propTypes = {
  /** Any additional className(s) for the root element */
  className: PropTypes.string,
};
JobHistory.defaultProps = {
  className: '',
};

export default JobHistory;
