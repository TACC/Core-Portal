import { combineReducers } from 'redux';
import { spinner, jobs } from './jobs.reducers';
import { app, apps } from './apps.reducers';
import { systems, files } from './datafiles.reducers';
import {
  ticketList,
  ticketDetailedView,
  ticketCreate
} from './tickets.reducers';
import systemMonitor from './systemMonitor.reducers';
import allocations from './allocations.reducers';
import authenticatedUser from './authenticated_user.reducer';
import { pushKeys } from './systems.reducers';

export default combineReducers({
  spinner,
  jobs,
  systems,
  systemMonitor,
  files,
  allocations,
  ticketList,
  ticketDetailedView,
  ticketCreate,
  authenticatedUser,
  app,
  apps,
  pushKeys
});
