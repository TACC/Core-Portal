import React from 'react';
import { Route } from 'react-router-dom';
import { useSelector, shallowEqual, useDispatch } from 'react-redux';
import { LoadingSpinner } from '_common';
import JobsView from '../../Jobs';
import JobHistoryModal from './JobHistoryModal';
import * as ROUTES from '../../../constants/routes';

import './HistoryViews.scss';

const JobHistory = () => {
  const dispatch = useDispatch();
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
        <div className="job-history">
          <JobsView showDetails showFancyStatus rowProps={rowProps} />
        </div>
      )}
      <Route
        path={`${ROUTES.WORKBENCH}${ROUTES.HISTORY}${ROUTES.JOBS}/:jobId`}
        render={({
          match: {
            params: { jobId }
          }
        }) => {
          dispatch({
            type: 'GET_JOB_DETAILS',
            payload: { jobId }
          });
          return <JobHistoryModal jobId={jobId} />;
        }}
      />
    </>
  );
};

export default JobHistory;
