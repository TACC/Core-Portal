import { combineReducers } from 'redux';
import { spinner, jobs } from './jobs.reducers';
import { systems, files } from './datafiles.reducers';
import systemMonitor from './systemMonitor.reducers';
import ticketHistory from './tickets.reducers';
import allocations from './allocations.reducers';
import profile from './profile.reducers';

export default combineReducers({
  spinner,
  jobs,
  systems,
  systemMonitor,
  files,
  allocations,
  ticketHistory,
  profile
});
