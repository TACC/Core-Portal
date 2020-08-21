import React from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import JobsView from '../../Jobs';

import './JobHistory.module.scss';
import './HistoryViews.scss';

const JobHistory = () => {
  const { notifs } = useSelector(
    state => state.notifications.list,
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
    <div className="job-history" styleName="root">
      <JobsView showDetails showFancyStatus rowProps={rowProps} />
    </div>
  );
};

export default JobHistory;
