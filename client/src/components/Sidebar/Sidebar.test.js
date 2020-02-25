import React from 'react';
import { MemoryRouter, Route } from 'react-router-dom';
import { render } from '@testing-library/react';
import Sidebar from './index';
import '@testing-library/jest-dom/extend-expect';

describe('workbench sidebar', () => {
  it.each([
    'Dashboard',
    'Data Files',
    'Applications',
    'Allocations',
  ])('should have a link to the %s page', page => {
    const { getByText } = render(
      <MemoryRouter initialEntries={['/workbench']}>
        <Route path='/workbench'>
          <Sidebar />
        </Route>
      </MemoryRouter>
    );
    expect(getByText(page)).toBeDefined();
    expect(getByText(page).closest('a')).toHaveAttribute(
      'href',
      `/workbench/${page === 'Data Files' ? 'data' : page.toLowerCase()}`
    );
  });
});
