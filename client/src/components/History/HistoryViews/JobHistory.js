import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { useSelector, shallowEqual } from 'react-redux';
import { useDispatch } from 'react-redux';
import JobsView from '../../Jobs';
import JobHistoryModal from './JobHistoryModal';
import * as ROUTES from '../../../constants/routes';
import './HistoryViews.scss';

const JobHistory = () => {
  const dispatch = useDispatch();
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
    <div className="job-history">
      <JobsView showDetails showFancyStatus rowProps={rowProps} />
      <Switch>
        <Route
          path={`${ROUTES.WORKBENCH}${ROUTES.HISTORY}${ROUTES.JOBS}/:jobId`}
          render={({ match: { params } }) => {
            dispatch({
              type: 'GET_JOB_DETAILS',
              payload: { jobId: params.jobId }
            });
            return <JobHistoryModal jobId={params.jobId} />;
          }}
        />
      </Switch>
    </div>
  );
};

export default JobHistory;
