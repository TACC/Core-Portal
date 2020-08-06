import { combineReducers } from 'redux';
import jobs from './jobs.reducers';
import { app, apps } from './apps.reducers';
import { systems, files } from './datafiles.reducers';
import {
  ticketList,
  ticketDetailedView,
  ticketCreate
} from './tickets.reducers';
import systemMonitor from './systemMonitor.reducers';
import allocations from './allocations.reducers';
import profile from './profile.reducers';
import authenticatedUser from './authenticated_user.reducer';
import { pushKeys } from './systems.reducers';
import notifications from './notifications.reducers';
import workbench from './workbench.reducers';

export default combineReducers({
  jobs,
  systems,
  systemMonitor,
  files,
  allocations,
  profile,
  ticketList,
  ticketDetailedView,
  ticketCreate,
  authenticatedUser,
  app,
  apps,
  pushKeys,
  notifications,
  workbench
});
