import { React, useState } from 'react';
import CMSWrapper from '_common/CMSWrapper';

import DataFilesForDPMBreadcrumbs from './DataFilesForDPMBreadcrumbs';
import DataFilesForDPMViews from './DataFilesForDPMViews';

import DataFilesForDPMBrowse from './DataFilesForDPMBrowse';
import DataFilesForDPMRead from './DataFilesForDPMRead';
import DataFilesForDPMData from './DataFilesForDPMData';

import './DataFilesForDPM.global.css';
import style from './DataFilesForDPM.module.css';

const tabs = [
  {
    label: 'Browse',
    view: 'browse',
    id: 'tab-browse',
    contentId: 'content-browse',
    Content: DataFilesForDPMBrowse,
  },
  {
    label: 'Read',
    view: 'read',
    id: 'tab-read',
    contentId: 'content-read',
    Content: DataFilesForDPMRead,
  },
  {
    label: 'Data',
    view: 'Data',
    id: 'tab-Data',
    contentId: 'content-data',
    Content: DataFilesForDPMData,
  },
];

function DataFilesForDPM() {
  const [view, setView] = useState('browse');

  return (
    <CMSWrapper>
      <DataFilesForDPMBreadcrumbs />
      <DataFilesForDPMViews
        navClassName={style.nav}
        contentClassName={style.content}
        tabs={tabs}
        view={view}
        setView={setView}
      />
    </CMSWrapper>
  );
}

export default DataFilesForDPM;
