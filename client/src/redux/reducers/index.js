import { combineReducers } from 'redux';
import { jobs, jobDetail } from './jobs.reducers';
import { app, apps } from './apps.reducers';
import { systems, files } from './datafiles.reducers';
import {
  ticketList,
  ticketDetailedView,
  ticketCreate,
  ticketCreateModal,
} from './tickets.reducers';
import requestAccess from './requestAccess.reducers';
import systemMonitor from './systemMonitor.reducers';
import allocations from './allocations.reducers';
import profile from './profile.reducers';
import authenticatedUser from './authenticated_user.reducer';
import { pushKeys } from './systems.reducers';
import notifications from './notifications.reducers';
import workbench from './workbench.reducers';
import { introMessages, customMessages } from './intro.reducers';
import { onboarding } from './onboarding.reducers';
import projects from './projects.reducers';
import { users } from './users.reducers';
import siteSearch from './siteSearch.reducers';

export default combineReducers({
  jobs,
  jobDetail,
  systems,
  systemMonitor,
  files,
  allocations,
  profile,
  ticketList,
  ticketDetailedView,
  ticketCreate,
  ticketCreateModal,
  requestAccess,
  authenticatedUser,
  app,
  apps,
  pushKeys,
  notifications,
  workbench,
  introMessages,
  customMessages,
  onboarding,
  projects,
  users,
  siteSearch,
});
