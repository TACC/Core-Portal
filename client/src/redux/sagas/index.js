import { all } from 'redux-saga/effects';
import { watchJobs } from './jobs.sagas';
import {
  watchFetchSystems,
  watchFetchFiles,
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
import { watchFetchTicketHistory, watchPostTicketReply } from './tickets.sagas';
import { watchProfileData } from './profile.sagas';

export default function* rootSaga() {
  yield all([
    watchJobs(),
    watchFetchSystems(),
    watchPushKeys(),
    watchFetchFiles(),
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
    watchUsers(),
    watchUserData(),
    watchSystemMonitor(),
    watchFetchTicketHistory(),
    watchPostTicketReply(),
    watchProfileData()
  ]);
}
