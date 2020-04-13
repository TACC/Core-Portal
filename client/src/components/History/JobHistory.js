import React, { useState } from 'react';
import JobsView from '../Jobs';

function JobHistory() {
  const [showDetails] = useState(true);
  return <JobsView showDetails={showDetails} />;
}

export default JobHistory;
