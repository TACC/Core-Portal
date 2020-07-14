import React from 'react';
import JobsView from '../Jobs';
import './JobHistory.scss';

export default function JobHistory() {
  return (
    <div className="job-history">
      <JobsView showDetails showFancyStatus />
    </div>
  );
}
