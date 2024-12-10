import { all, select, takeEvery, fork } from 'redux-saga/effects';
import { watchJobs, watchJobDetails } from './jobs.sagas';
import watchApps from './apps.sagas';
import watchSystems from './systems.sagas';
import { watchSocket, watchFetchNotifications } from './notifications.sagas';
import {
  watchFetchSystems,
  watchFetchFiles,
  watchFetchFilesModal,
  watchScrollFiles,
  watchRename,
  watchMove,
  watchCopy,
  watchUpload,
  watchPreview,
  watchMkdir,
  watchDownload,
  watchCompress,
  watchExtract,
  watchLink,
  watchTrash,
  watchEmpty,
  watchMakePublic,
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
  watchTicketCreateCloseModal,
} from './tickets.sagas';
import { watchPostRequestAccess } from './requestAccess.sagas';
import { watchAuthenticatedUser } from './authenticated_user.sagas';
import { watchWorkbench } from './workbench.sagas';
import {
  watchFetchIntroMessageComponents,
  watchSaveIntroMessageComponents,
  watchFetchCustomMessages,
  watchSaveCustomMessages,
} from './portalMessages.sagas';
import {
  watchOnboardingAdminList,
  watchOnboardingAdminIndividualUser,
  watchOnboardingAction,
} from './onboarding.sagas';
import { watchProjects } from './projects.sagas';
import { watchUsers } from './users.sagas';
import { watchSiteSearch } from './siteSearch.sagas';
import { watchPublications } from './publications.sagas';

function* watchStartCustomSaga() {
  yield takeEvery('START_CUSTOM_SAGA', startCustomSaga);
}

function* startCustomSaga(action) {
  const portalName = yield select((state) => {
    return state.workbench.portalName;
  });

  const { default: customSaga } = yield import(
    `./_custom/${portalName.toLowerCase()}.sagas.js`
  );

  if (customSaga) {
    yield fork(customSaga);
  }
}

export default function* rootSaga() {
  yield all([
    watchJobs(),
    watchJobDetails(),
    watchFetchSystems(),
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
    watchEmpty(),
    watchMakePublic(),
    ...watchAllocations,
    watchCompress(),
    watchExtract(),
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
    watchPostRequestAccess(),
    watchTicketCreateOpenModal(),
    watchTicketCreateCloseModal(),
    watchAuthenticatedUser(),
    watchSocket(),
    watchFetchNotifications(),
    watchWorkbench(),
    watchFetchIntroMessageComponents(),
    watchFetchCustomMessages(),
    watchSaveIntroMessageComponents(),
    watchSaveCustomMessages(),
    watchOnboardingAdminList(),
    watchOnboardingAdminIndividualUser(),
    watchOnboardingAction(),
    watchProjects(),
    watchUsers(),
    watchSiteSearch(),
    watchStartCustomSaga(),
    watchPublications(),
  ]);
}
