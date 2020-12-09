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
import './DataFilesModals.scss';

export default function DataFilesModals() {
  return (
    <>
      <DataFilesPreviewModal />
      <DataFilesMoveModal />
      <DataFilesCopyModal />
      <DataFilesUploadModal direction="horizontal" density="compact" />
      <DataFilesMkdirModal />
      <DataFilesRenameModal />
      <DataFilesPushKeysModal />
      <DataFilesTrashModal />
      <SystemsPushKeysModal />
    </>
  );
}
