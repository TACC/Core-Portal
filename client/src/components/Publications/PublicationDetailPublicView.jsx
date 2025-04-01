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
import DataFilesLargeDownloadModal from '../DataFiles/DataFilesModals/DataFilesLargeDownloadModal';
import DataFilesPublicationDownloadModal from '../DataFiles/DataFilesModals/DataFilesPublicationDownloadModal';

function PublicationDetailPublicView({ params }) {
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
        path={params.path || ''}
        section="FilesListing"
        basePath="/publications"
      />
      <DataFilesProjectFileListing
        rootSystem={params.root_system}
        system={params.system}
        path={params.path || '/'}
        basePath="/publications"
      />
      <DataFilesPreviewModal />
      <DataFilesShowPathModal />
      <DataFilesProjectTreeModal />
      <DataFilesPublicationAuthorsModal />
      <DataFilesProjectCitationModal />
      <DataFilesViewDataModal />
      <DataFilesCopyModal />
      <DataFilesLargeDownloadModal />
      <DataFilesPublicationDownloadModal />
    </div>
  );
}

export default PublicationDetailPublicView;
