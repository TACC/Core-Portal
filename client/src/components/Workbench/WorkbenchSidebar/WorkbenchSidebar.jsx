import React from 'react';
import { useSelector } from 'react-redux';
import * as ROUTES from '../../../constants/routes';
import HistoryBadge from '../../History/HistoryBadge';
import './WorkbenchSidebar.global.scss'; // XXX: Global stylesheet imported in component
import { Sidebar } from '_common';
import { useWorkbenchConfig } from '@tacc/core-hooks';

/** A navigation list for the application */
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
        groupedNav,
      },
    },
  } = useWorkbenchConfig();

  const useGroupedNav = groupedNav == true;

  const defaultItems = [
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
      to: path + ROUTES.SYSTEM_STATUS,
      label: 'System Status',
      iconName: 'data-files',
      disabled: disabled,
      hidden: hideSystemStatus,
    },
    {
      to: path + ROUTES.UI,
      label: 'UI Patterns',
      iconName: 'copy',
      disabled: disabled,
      hidden: !showUIPatterns,
    },
  ];

  const groupedItems = [
    {
      to: path + ROUTES.DASHBOARD,
      label: 'Getting Started',
      iconName: 'dashboard',
      disabled: disabled,
    },
    {
      to: path + ROUTES.DATA,
      label: 'Data Files',
      iconName: 'folder',
      disabled: disabled,
      hidden: hideDataFiles,
      category: 'Doing My Science',
    },
    {
      to: path + ROUTES.APPLICATIONS,
      label: 'Apps',
      iconName: 'applications',
      disabled: disabled,
      hidden: hideApps,
      category: 'Doing My Science',
    },
    {
      to: path + ROUTES.HISTORY,
      label: 'Job History',
      iconName: 'history',
      disabled: disabled,
      hidden: hideApps,
      children: <HistoryBadge unread={unread} disabled={disabled} />,
      category: 'Doing My Science',
    },
    {
      to: path + ROUTES.TICKETS,
      label: 'My Tickets',
      iconName: 'multiple-coversation',
      disabled: disabled,
      category: 'My Tools',
    },
    {
      to: path + ROUTES.JOBS,
      label: 'My Jobs',
      iconName: 'jobs',
      disabled: disabled,
      category: 'My Tools',
    },
    {
      to: path + ROUTES.SYSTEM_STATUS,
      label: 'System Status',
      iconName: 'data-files',
      disabled: disabled,
      hidden: hideSystemStatus,
      category: 'My Tools',
    },
    {
      to: path + ROUTES.ALLOCATIONS,
      label: 'Allocations',
      iconName: 'allocations',
      disabled: disabled,
      hidden: hideAllocations,
      category: 'Etc.',
    },
    {
      to: path + ROUTES.UI,
      label: 'UI Patterns',
      iconName: 'copy',
      disabled: disabled,
      hidden: !showUIPatterns,
      category: 'Etc.',
    },
  ];

  const addItems = [];
  return (
    <Sidebar
      sidebarItems={useGroupedNav ? groupedItems : defaultItems}
      addItemsAfter={addItems}
      loading={loading}
      isMain
    />
  );
};

export default WorkbenchSidebar;
