import React from 'react';
import DataFilesPublicationsList from '../DataFiles/DataFilesPublicationsList/DataFilesPublicationsList';
import DataFilesProjectDescriptionModal from '../DataFiles/DataFilesModals/DataFilesProjectDescriptionModal';
import { PUBLICATIONS } from '../../constants/routes';

function PublicationsPublicView() {
  return (
    <div>
      <DataFilesPublicationsList basePath={PUBLICATIONS} />
      <DataFilesProjectDescriptionModal />
    </div>
  );
}

export default PublicationsPublicView