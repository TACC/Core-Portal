import React from 'react';
import { Sidebar } from '_common';

function UIPatternsSidebar() {
  const sidebarItems = [
    { to: 'history', iconName: 'trash', children: 'History' },
    { to: 'allocations', iconName: 'alert', children: 'Allocations' },
    {
      to: 'applications',
      iconName: 'alert',
      children: 'Disabled',
      disabled: true,
    },
    { to: 'ui-patterns', iconName: 'file', children: 'Here' },
  ];
  return (
    <dl>
      <dd>
        <Sidebar sidebarItems={sidebarItems} />
      </dd>
    </dl>
  );
}

export default UIPatternsSidebar;
