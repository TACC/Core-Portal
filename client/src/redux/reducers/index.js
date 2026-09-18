import { combineReducers } from 'redux';
// TODOv3: dropV2Jobs
import { jobs, jobDetail, jobsv2 } from './jobs.reducers';
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
import { allocations } from './allocations.reducers';
import profile from './profile.reducers';
import authenticatedUser from './authenticated_user.reducer';
import { pushKeys } from './systems.reducers';
import notifications from './notifications.reducers';
import workbench from './workbench.reducers';
import {
  introMessageComponents,
  customMessages,
} from './portalMessages.reducers';
import { onboarding } from './onboarding.reducers';
import projects from './projects.reducers';
import { users } from './users.reducers';
import siteSearch from './siteSearch.reducers';
import publications from './publications.reducers';

export default combineReducers({
  jobs,
  // TODOv3: dropV2Jobs
  jobsv2,
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
  introMessageComponents,
  customMessages,
  onboarding,
  projects,
  users,
  siteSearch,
  publications,
});
