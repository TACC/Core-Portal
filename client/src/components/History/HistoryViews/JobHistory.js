import React from 'react';
import JobsView from '../../Jobs';

const JobHistory = () => {
  return (
    <div className="job-history">
      <JobsView showDetails showFancyStatus />
    </div>
  );
};

export default JobHistory;
