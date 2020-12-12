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
import DataFilesAddProjectModal from './DataFilesAddProjectModal';
import DataFilesManageProjectModal from './DataFilesManageProjectModal';
import DataFilesProjectEditDescriptionModal from './DataFilesProjectEditDescriptionModal';
import './DataFilesModals.scss';

export default function DataFilesModals() {
  return (
    <>
      <DataFilesPreviewModal />
      <DataFilesMoveModal />
      <DataFilesCopyModal />
      <DataFilesUploadModal />
      <DataFilesMkdirModal />
      <DataFilesRenameModal />
      <DataFilesPushKeysModal />
      <DataFilesTrashModal />
      <SystemsPushKeysModal />
      <DataFilesAddProjectModal />
      <DataFilesManageProjectModal />
      <DataFilesProjectEditDescriptionModal />
    </>
  );
}
