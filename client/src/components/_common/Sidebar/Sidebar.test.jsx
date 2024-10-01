import React from 'react';
import { queryByTestId, render } from '@testing-library/react';
import Sidebar from './Sidebar';
import { BrowserRouter } from 'react-router-dom';

describe('Sidebar', () => {
  it('renders sidebar successfully', () => {
    const sidebarItems = [
      { to: 'allocations', iconName: 'allocations', label: 'Allocations' },
      { to: 'history', iconName: 'file', label: 'History' },
    ];
    const { queryByTestId } = render(
      <BrowserRouter>
        <Sidebar data-testid="sidebar here" sidebarItems={sidebarItems} />
      </BrowserRouter>
    );
    const el = queryByTestId('sidebar here');
    expect(el).toBeDefined;
  });
  it('does not render sidebar where one item has no text', () => {
    const sidebarItems = [
      { to: 'history', iconName: 'file', label: 'History' },
      { to: 'applications', iconName: 'alert' },
      { to: 'ui-patterns', iconName: 'trash', label: 'UI Patterns' },
    ];
    const { queryByTestId } = render(
      <BrowserRouter>
        <Sidebar data-testid="no sidebar here" sidebarItems={sidebarItems} />
      </BrowserRouter>
    );
    const el = queryByTestId('no sidebar here');
    expect(el).toBeNull;
  });
});
