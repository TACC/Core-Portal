import { all } from 'redux-saga/effects';
import { watchJobs, watchJobDetails } from './jobs.sagas';
import watchApps from './apps.sagas';
import watchSystems from './systems.sagas';
import { watchSocket, watchFetchNotifications } from './notifications.sagas';

import {
  watchFetchSystems,
  watchFetchFiles,
  watchFetchFilesModal,
  watchPushKeys,
  watchScrollFiles,
  watchRename,
  watchMove,
  watchCopy,
  watchUpload,
  watchPreview,
  watchMkdir,
  watchDownload,
  watchLink,
  watchTrash
} from './datafiles.sagas';
import watchAllocations from './allocations.sagas';
import watchSystemMonitor from './systemMonitor.sagas';
import watchProfile from './profile.sagas';
import {
  watchTicketListFetch,
  watchTicketDetailedView,
  watchTicketDetailedViewFetchHistory,
  watchTicketDetailedViewFetchSubject,
  watchPostTicketReply,
  watchPostTicketCreate,
  watchTicketCreateOpenModal,
  watchTicketCreateCloseModal
} from './tickets.sagas';
import { watchAuthenticatedUser } from './authenticated_user.sagas';
import { watchWorkbench } from './workbench.sagas';
import {
  watchFetchWelcomeMessages,
  watchSaveWelcomeMessages
} from './welcome.sagas';
import {
  watchOnboardingAdminList,
  watchOnboardingAdminIndividualUser,
  watchOnboardingAction
} from './onboarding.sagas';
import { watchProjects } from './projects.sagas';
import { watchUsers } from './users.sagas';
import { watchSiteSearch } from './siteSearch.sagas';

export default function* rootSaga() {
  yield all([
    watchJobs(),
    watchJobDetails(),
    watchFetchSystems(),
    watchPushKeys(),
    watchFetchFiles(),
    watchFetchFilesModal(),
    watchScrollFiles(),
    watchRename(),
    watchMove(),
    watchCopy(),
    watchUpload(),
    watchPreview(),
    watchMkdir(),
    watchDownload(),
    watchLink(),
    watchTrash(),
    ...watchAllocations,
    watchApps(),
    watchSystems(),
    watchSystemMonitor(),
    ...watchProfile,
    watchTicketListFetch(),
    watchTicketDetailedView(),
    watchTicketDetailedViewFetchHistory(),
    watchTicketDetailedViewFetchSubject(),
    watchPostTicketReply(),
    watchPostTicketCreate(),
    watchTicketCreateOpenModal(),
    watchTicketCreateCloseModal(),
    watchAuthenticatedUser(),
    watchSocket(),
    watchFetchNotifications(),
    watchWorkbench(),
    watchFetchWelcomeMessages(),
    watchSaveWelcomeMessages(),
    watchOnboardingAdminList(),
    watchOnboardingAdminIndividualUser(),
    watchOnboardingAction(),
    watchProjects(),
    watchUsers(),
    watchSiteSearch()
  ]);
}
