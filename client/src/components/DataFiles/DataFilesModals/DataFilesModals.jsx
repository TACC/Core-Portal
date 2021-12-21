import React from 'react';
import SystemsPushKeysModal from '_common/SystemsPushKeysModal';
import DataFilesPreviewModal from './DataFilesPreviewModal';
import DataFilesMoveModal from './DataFilesMoveModal';
import DataFilesUploadModal from './DataFilesUploadModal';
import DataFilesMkdirModal from './DataFilesMkdirModal';
import DataFilesRenameModal from './DataFilesRenameModal';
import DataFilesPushKeysModal from './DataFilesPushKeysModal';
import DataFilesCopyModal from './DataFilesCopyModal';
import DataFilesTrashModal from './DataFilesTrashModal';
import DataFilesCompressModal from './DataFilesCompressModal';
import DataFilesExtractModal from './DataFilesExtractModal';
import DataFilesAddProjectModal from './DataFilesAddProjectModal';
import DataFilesManageProjectModal from './DataFilesManageProjectModal';
import DataFilesProjectEditDescriptionModal from './DataFilesProjectEditDescriptionModal';
import DataFilesLinkModal from './DataFilesLinkModal';
import DataFilesShowPathModal from './DataFilesShowPathModal';
import DataFilesMakePublicModal from './DataFilesMakePublicModal';
import DataFilesDownloadMessageModal from './DataFilesDownloadMessageModal';
import './DataFilesModals.scss';

export default function DataFilesModals() {
  return (
    <>
      <DataFilesPreviewModal />
      <DataFilesMoveModal />
      <DataFilesCopyModal />
      <DataFilesUploadModal layout="default" />
      <DataFilesMkdirModal />
      <DataFilesRenameModal />
      <DataFilesPushKeysModal />
      <DataFilesTrashModal />
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
    </>
  );
}
