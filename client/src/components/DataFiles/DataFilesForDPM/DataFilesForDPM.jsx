import { React } from 'react';  // Remove useEffect
import CMSWrapper from '_common/CMSWrapper';

import DataFilesForDPMBreadcrumbs from './DataFilesForDPMBreadcrumbs';
import DataFilesForDPMBrowse from './DataFilesForDPMBrowse';

import './DataFilesForDPM.global.css';

function DataGallery() {
  return (
    <CMSWrapper>
      <DataFilesForDPMBreadcrumbs />
      <DataFilesForDPMBrowse />
    </CMSWrapper>
  );
}

export default DataGallery;
