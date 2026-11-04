import React from 'react';
import { useSelector } from 'react-redux';
import * as ROUTES from '../../../constants/routes';
import HistoryBadge from '../../History/HistoryBadge';
import './WorkbenchSidebar.global.scss'; // XXX: Global stylesheet imported in component
import { Sidebar } from '_common';
import { useWorkbenchConfig } from '@tacc/core-hooks';

const WorkbenchSidebar = ({ disabled, showUIPatterns, loading }) => {
  const path = ROUTES.WORKBENCH;

  const unread = useSelector((state) => state.notifications.list.unread);

  const {
    data: {
      config: {
        hideDataFiles,
        hideAllocations,
        hideSystemStatus,
        hideApps,
        sidebarLayout,
      },
    },
  } = useWorkbenchConfig();

  const itemRegistry = {
    dashboard: {
      to: path + ROUTES.DASHBOARD,
      label: 'Dashboard',
      iconName: 'dashboard',
    },
    data: {
      to: path + ROUTES.DATA,
      label: 'Data Files',
      iconName: 'folder',
      hidden: hideDataFiles,
    },
    applications: {
      to: path + ROUTES.APPLICATIONS,
      label: 'Applications',
      iconName: 'applications',
      hidden: hideApps,
    },
    allocations: {
      to: path + ROUTES.ALLOCATIONS,
      label: 'Allocations',
      iconName: 'allocations',
      hidden: hideAllocations,
    },
    history: {
      to: path + ROUTES.HISTORY,
      label: 'History',
      iconName: 'history',
      hidden: hideApps,
      children: <HistoryBadge unread={unread} disabled={disabled} />,
    },
    tickets: {
      to: path + ROUTES.TICKETS,
      label: 'Tickets',
      iconName: 'multiple-coversation',
    },
    systemStatus: {
      to: path + ROUTES.SYSTEM_STATUS,
      label: 'System Status',
      iconName: 'data-files',
      hidden: hideSystemStatus,
    },
    ui: {
      to: path + ROUTES.UI,
      label: 'UI Patterns',
      iconName: 'copy',
      hidden: !showUIPatterns,
    },
  };

  const defaultLayout = [
    { id: 'dashboard' },
    { id: 'data' },
    { id: 'applications' },
    { id: 'allocations' },
    { id: 'history' },
    { id: 'systemStatus' },
    { id: 'ui' },
  ];

  const addItems = [];

  const layout = sidebarLayout?.length ? sidebarLayout : defaultLayout;

  const sidebarItems = layout
    .filter(({ id }) => {
      if (!itemRegistry[id]) {
        console.warn(`WorkbenchSidebar: unknown sidebar item id "${id}"`);
        return false;
      }
      return true;
    })
    .map(({ id, category, label }) => ({
      ...itemRegistry[id],
      ...(label && { label }),
      ...(category && { category }),
      disabled,
    }));

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
