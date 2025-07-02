import React from 'react';
import SystemsPushKeysModal from '_common/SystemsPushKeysModal';
import DataFilesPreviewModal from './DataFilesPreviewModal';
import DataFilesMoveModal from './DataFilesMoveModal';
import DataFilesUploadModal from './DataFilesUploadModal';
import DataFilesMkdirModal from './DataFilesMkdirModal';
import DataFilesRenameModal from './DataFilesRenameModal';
import DataFilesCopyModal from './DataFilesCopyModal';
import DataFilesEmptyModal from './DataFilesEmptyModal';
import DataFilesCompressModal from './DataFilesCompressModal';
import DataFilesExtractModal from './DataFilesExtractModal';
import DataFilesAddProjectModal from './DataFilesAddProjectModal';
import DataFilesManageProjectModal from './DataFilesManageProjectModal';
import DataFilesProjectEditDescriptionModal from './DataFilesProjectEditDescriptionModal';
import DataFilesLinkModal from './DataFilesLinkModal';
import DataFilesShowPathModal from './DataFilesShowPathModal';
import DataFilesMakePublicModal from './DataFilesMakePublicModal';
import DataFilesDownloadMessageModal from './DataFilesDownloadMessageModal';
import DataFilesLargeDownloadModal from './DataFilesLargeDownloadModal';
import DataFilesNoFoldersModal from './DataFilesNoFoldersModal';
import './DataFilesModals.scss';
import DataFilesFormModal from './DataFilesFormModal';
import DataFilesPublicationRequestModal from './DataFilesPublicationRequestModal';
import DataFilesPublicationDownloadModal from './DataFilesPublicationDownloadModal';
import DataFilesProjectTreeModal from './DataFilesProjectTreeModal';
import DataFilesProjectDescriptionModal from './DataFilesProjectDescriptionModal';
import DataFilesViewDataModal from './DataFilesViewDataModal';
import DataFilesProjectCitationModal from './DataFilesProjectCitationModal';
import DataFilesPublicationAuthorsModal from './DataFilesPublicationAuthorsModal';

export default function DataFilesModals() {
  return (
    <>
      <DataFilesPreviewModal />
      <DataFilesMoveModal />
      <DataFilesCopyModal />
      <DataFilesUploadModal layout="default" />
      <DataFilesMkdirModal />
      <DataFilesRenameModal />
      <DataFilesEmptyModal />
      <DataFilesLinkModal />
      <DataFilesShowPathModal />
      <SystemsPushKeysModal />
      <DataFilesCompressModal />
      <DataFilesExtractModal />
      <DataFilesAddProjectModal />
      <DataFilesManageProjectModal />
      <DataFilesProjectEditDescriptionModal />
      <DataFilesMakePublicModal />
      <DataFilesDownloadMessageModal />
      <DataFilesFormModal />
      <DataFilesProjectTreeModal />
      <DataFilesPublicationRequestModal />
      <DataFilesPublicationDownloadModal />
      <DataFilesProjectDescriptionModal />
      <DataFilesViewDataModal />
      <DataFilesProjectCitationModal />
      <DataFilesPublicationAuthorsModal />
      <DataFilesLargeDownloadModal />
      <DataFilesNoFoldersModal />
    </>
  );
}
