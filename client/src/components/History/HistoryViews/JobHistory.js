import React from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import { LoadingSpinner } from '_common';
import JobsView from '../../Jobs';

import './JobHistory.module.scss';
import './HistoryViews.scss';

const JobHistory = () => {
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
    <>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="job-history" styleName="root">
          <JobsView showDetails showFancyStatus rowProps={rowProps} />
        </div>
      )}
    </>
  );
};

export default JobHistory;
