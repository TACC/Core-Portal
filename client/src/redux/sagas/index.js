import { all } from 'redux-saga/effects';
import { watchJobs } from './jobs.sagas';
import watchApps from './apps.sagas';
import watchSystems from './systems.sagas';

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
  watchTrash
} from './datafiles.sagas';
import {
  watchAllocations,
  watchUserData,
  watchUsers
} from './allocations.sagas';
import watchSystemMonitor from './systemMonitor.sagas';
import {
  watchProfileData,
  watchFormFields,
  watchChangePassword
} from './profile.sagas';
import {
  watchTicketListFetch,
  watchTicketDetailedView,
  watchTicketDetailedViewFetchHistory,
  watchTicketDetailedViewFetchSubject,
  watchPostTicketReply,
  watchPostTicketCreate
} from './tickets.sagas';
import { watchAuthenticatedUser } from './authenticated_user.sagas';

export default function* rootSaga() {
  yield all([
    watchJobs(),
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
    watchTrash(),
    watchAllocations(),
    watchApps(),
    watchSystems(),
    watchUsers(),
    watchUserData(),
    watchSystemMonitor(),
    watchPostTicketReply(),
    watchProfileData(),
    watchFormFields(),
    watchChangePassword(),
    watchTicketListFetch(),
    watchTicketDetailedView(),
    watchTicketDetailedViewFetchHistory(),
    watchTicketDetailedViewFetchSubject(),
    watchPostTicketReply(),
    watchPostTicketCreate(),
    watchAuthenticatedUser()
  ]);
}
