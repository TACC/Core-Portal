import { React, useEffect } from 'react';
import CMSWrapper from '_common/CMSWrapper';

import DataFilesForDPMBreadcrumbs from './DataFilesForDPMBreadcrumbs';
import DataFilesForDPMBrowse from './DataFilesForDPMBrowse';

function DataFilesForDPM() {
  useEffect(() => {
    // FAQ: If @import'ed via DataFilesForDPM.global.css,
    //      styles would remain active after component unmount
    //      (the effect was seen on system-status/ table margin bottom)
    return CMSWrapper.useDynamicStylesheets(
      [
        'https://cdn.jsdelivr.net/gh/TACC/Core-CMS-Custom@5717c8d/digitalrocks_assets/css/cms.css',
        'https://cdn.jsdelivr.net/gh/TACC/Core-CMS-Custom@5717c8d/digitalrocks_assets/css/for-core-styles.css',
      ],
      'DataFilesForDPM'
    );
  }, []);

  return (
    <CMSWrapper>
      <DataFilesForDPMBreadcrumbs />
      <DataFilesForDPMBrowse />
    </CMSWrapper>
  );
}

export default DataFilesForDPM;
