import { combineReducers } from 'redux';
// TODOv3: dropV2Jobs
import { jobs, jobDetail, jobsv2 } from './jobs.reducers';
import { app, apps } from './apps.reducers';
import { systems, files } from './datafiles.reducers';

import requestAccess from './requestAccess.reducers';
import systemMonitor from './systemMonitor.reducers';
import { allocations } from './allocations.reducers';
import profile from './profile.reducers';
import { pushKeys } from './systems.reducers';
import notifications from './notifications.reducers';
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
  requestAccess,
  app,
  apps,
  pushKeys,
  notifications,
  introMessageComponents,
  customMessages,
  onboarding,
  projects,
  users,
  siteSearch,
  publications,
});
