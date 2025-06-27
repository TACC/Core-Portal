import { React, useEffect } from 'react';
import CMSWrapper from '_common/CMSWrapper';

import DataFilesForDPMBreadcrumbs from './DataFilesForDPMBreadcrumbs';
import DataFilesForDPMBrowse from './DataFilesForDPMBrowse';

function DataGallery() {
  useEffect(() => {
    // To load external CSS and unload on umount
    // FAQ: As ….global.css, styles would remain after unmount;
    //      effect seen on system-status/ table margin bottom
    const cssUrls = [
      'https://cdn.jsdelivr.net/gh/TACC/Core-CMS-Custom@5717c8d/digitalrocks_assets/css/cms.css',
      'https://cdn.jsdelivr.net/gh/TACC/Core-CMS-Custom@5717c8d/digitalrocks_assets/css/for-core-styles.css'
    ];

    const links = cssUrls.map(url => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      document.head.appendChild(link);
      return link;
    });

    return () => {
      links.forEach(link => link.remove());
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
