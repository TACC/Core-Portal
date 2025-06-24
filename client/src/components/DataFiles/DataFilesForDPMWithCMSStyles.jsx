import { React, useEffect } from 'react';
import CMSWrapper from '../_common/CMSWrapper';

import DataFilesForDPMWithCMSStylesBreadcrumbs from './DataFilesForDPMWithCMSStylesBreadcrumbs';
import DataFilesForDPMWithCMSStylesSampleHTML from './DataFilesForDPMWithCMSStylesSampleHTML';

import './DataFilesForDPMWithCMSStyles.global.css';

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
      <DataFilesForDPMWithCMSStylesBreadcrumbs />
      <DataFilesForDPMWithCMSStylesSampleHTML />
    </CMSWrapper>
  );
}

export default DataGallery;
