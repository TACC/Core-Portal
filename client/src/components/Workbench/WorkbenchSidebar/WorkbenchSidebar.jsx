import React from 'react';
import { useSelector } from 'react-redux';
import * as ROUTES from '../../../constants/routes';
import HistoryBadge from '../../History/HistoryBadge';
import './WorkbenchSidebar.global.scss';
import { Sidebar } from '_common';
import { useWorkbenchConfig } from '@tacc/core-hooks';

const path = ROUTES.WORKBENCH;

const DEFAULT_LAYOUT = [
  'dashboard',
  'data',
  'applications',
  'allocations',
  'history',
  'systemStatus',
  'ui',
].map((id) => ({ id }));

const WorkbenchSidebar = ({ disabled, showUIPatterns, loading }) => {
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

  const layout = sidebarLayout?.length ? sidebarLayout : DEFAULT_LAYOUT;

  const sidebarItems = layout.flatMap(({ id, category, label }) => {
    const item = itemRegistry[id];
    if (!item) {
      console.warn(`WorkbenchSidebar: unknown sidebar item id "${id}"`);
      return [];
    }
    return [{ ...item, label: label ?? item.label, category, disabled }];
  });

  const addItems = [];

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
