import React from 'react';
import { useRouteMatch } from 'react-router-dom';
import { useSelector } from 'react-redux';
import * as ROUTES from '../../../constants/routes';
import HistoryBadge from '../../History/HistoryBadge';
import './WorkbenchSidebar.global.scss'; // XXX: Global stylesheet imported in component
import { Sidebar } from '_common';

/** A navigation list for the application */
const WorkbenchSidebar = ({ disabled, showUIPatterns, loading }) => {
  let { path } = useRouteMatch();
  if (path.includes('accounts')) path = ROUTES.WORKBENCH;

  const unread = useSelector((state) => state.notifications.list.unread);
  const hideApps = useSelector((state) => state.workbench.config.hideApps);
  const hideDataFiles = useSelector(
    (state) => state.workbench.config.hideDataFiles
  );
  const hideAllocations = useSelector(
    (state) => state.workbench.config.hideAllocations
  );
  const sidebarItems = [
    {
      to: path + ROUTES.DASHBOARD,
      label: 'Dashboard',
      iconName: 'dashboard',
      disabled: disabled,
    },
    {
      to: path + ROUTES.DATA,
      label: 'Data Files',
      iconName: 'folder',
      disabled: disabled,
      hidden: hideDataFiles,
    },
    {
      to: path + ROUTES.APPLICATIONS,
      label: 'Applications',
      iconName: 'applications',
      disabled: disabled,
      hidden: hideApps,
    },
    {
      to: path + ROUTES.ALLOCATIONS,
      label: 'Allocations',
      iconName: 'allocations',
      disabled: disabled,
      hidden: hideAllocations,
    },
    {
      to: path + ROUTES.HISTORY,
      label: 'History',
      iconName: 'history',
      disabled: disabled,
      hidden: hideApps,
      children: <HistoryBadge unread={unread} disabled={disabled} />,
    },
    {
      to: path + ROUTES.UI,
      label: 'UI Patterns',
      iconName: 'copy',
      disabled: disabled,
      hidden: !showUIPatterns,
    },
  ];
  const addItems = [
  ];
  return (
    <Sidebar
      sidebarItems={sidebarItems}
      addItemsAfter={addItems}
      loading={loading}
      isMain
    />
  );
};

export default WorkbenchSidebar;
