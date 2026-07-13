import React from 'react';
import CombinedBreadcrumbs from '../DataFiles/CombinedBreadcrumbs/CombinedBreadcrumbs';
import DataFilesPreviewModal from '../DataFiles/DataFilesModals/DataFilesPreviewModal';
import DataFilesCopyModal from '../DataFiles/DataFilesModals/DataFilesCopyModal';
import DataFilesProjectCitationModal from '../DataFiles/DataFilesModals/DataFilesProjectCitationModal';
import DataFilesProjectTreeModal from '../DataFiles/DataFilesModals/DataFilesProjectTreeModal';
import DataFilesPublicationAuthorsModal from '../DataFiles/DataFilesModals/DataFilesPublicationAuthorsModal';
import DataFilesShowPathModal from '../DataFiles/DataFilesModals/DataFilesShowPathModal';
import DataFilesViewDataModal from '../DataFiles/DataFilesModals/DataFilesViewDataModal';
import DataFilesProjectFileListing from '../DataFiles/DataFilesProjectFileListing/DataFilesProjectFileListing';
import DataFilesToolbar from '../DataFiles/DataFilesToolbar/DataFilesToolbar';
import NotificationToast from '../Toasts';
import DataFilesUnavailDownloadModal from '../DataFiles/DataFilesModals/DataFilesUnavailDownloadModal';
import DataFilesPublicationDownloadModal from '../DataFiles/DataFilesModals/DataFilesPublicationDownloadModal';
import { getDecodedPath } from '../../utils/datafilesUtil';
import { PUBLICATIONS } from '../../constants/routes'


function PublicationDetailPublicView({ params }) {
  
  const decodedPath = getDecodedPath(params.path);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '10px',
      }}
    >
      <NotificationToast />
      <DataFilesToolbar api="tapis" scheme="public" />
      <CombinedBreadcrumbs
        api="tapis"
        scheme="projects"
        system={params.system}
        path={decodedPath}
        section="FilesListing"
        basePath={PUBLICATIONS}
      />
      <DataFilesProjectFileListing
        rootSystem={params.root_system}
        system={params.system}
        path={decodedPath}
        basePath={PUBLICATIONS}
      />
      <DataFilesPreviewModal />
      <DataFilesShowPathModal />
      <DataFilesProjectTreeModal />
      <DataFilesPublicationAuthorsModal />
      <DataFilesProjectCitationModal />
      <DataFilesViewDataModal />
      <DataFilesCopyModal />
      <DataFilesUnavailDownloadModal />
      <DataFilesPublicationDownloadModal />
    </div>
  );
}

export default PublicationDetailPublicView;
