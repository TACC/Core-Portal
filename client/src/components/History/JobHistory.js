import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import JobsView from '../Jobs';
import JobHistoryModal from './JobHistoryModal';
import * as ROUTES from '../../constants/routes';
import './JobHistory.scss';

export default function JobHistory() {
  const dispatch = useDispatch();

  return (
    <div className="job-history">
      <JobsView showDetails showFancyStatus />
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
}
