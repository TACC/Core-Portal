import React, { useState } from 'react';
import JobsView from '../Jobs';

export default function JobHistory() {
  const [showDetails] = useState(true);
  return <JobsView showDetails={showDetails} />;
}
