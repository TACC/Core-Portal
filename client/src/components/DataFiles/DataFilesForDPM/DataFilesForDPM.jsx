import { React, useEffect } from 'react';
import CMSWrapper from '_common/CMSWrapper';

import DataFilesForDPMBreadcrumbs from './DataFilesForDPMBreadcrumbs';
import DataFilesForDPMBrowse from './DataFilesForDPMBrowse';

import './DataFilesForDPM.global.css';

function DataGallery() {
  useEffect(() => {
    // To (de)activate CMS styles on (un)mount
    window.dispatchEvent(new CustomEvent('cms-styles-activated'));
    return () => {
      window.dispatchEvent(new CustomEvent('cms-styles-deactivated'));
    };
  }, []);

  return (
    <CMSWrapper>
      <DataFilesForDPMBreadcrumbs />
      <DataFilesForDPMBrowse />
    </CMSWrapper>
  );
}

export default DataGallery;
