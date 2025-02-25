import React from 'react';
import DataFilesPublicationsList from '../DataFiles/DataFilesPublicationsList/DataFilesPublicationsList';
import DataFilesProjectDescriptionModal from '../DataFiles/DataFilesModals/DataFilesProjectDescriptionModal';

function PublicationsPublicView() {
  return (
    <div>
      <DataFilesPublicationsList basePath="/publications" />
      <DataFilesProjectDescriptionModal />
    </div>
  );
}

export default PublicationsPublicView