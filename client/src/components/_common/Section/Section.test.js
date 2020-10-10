import React from 'react';
import { render } from '@testing-library/react';
import Section from './Section';

describe('Section', () => {
  describe('elements', () => {
    it('includes content, header, and heading with appropriate roles', () => {
      const { getByRole } = render(<Section header="Header" content={<p>Content</p>} />);
      // WARNING: Only one `main` is allowed per page
      expect(getByRole('main').textContent).toEqual('Content');
      // NOTE: Technically (https://www.w3.org/TR/html-aria/#el-header), the `header` should not have a role, but `aria-query` recognizes it as a banner (https://github.com/A11yance/aria-query/pull/59)
      expect(getByRole('banner').textContent).toEqual('Header');
      expect(getByRole('heading').textContent).toEqual('Header');
    });
  });

  describe('content', () => {
    it('renders all passed content and classes', () => {
      const { container, getByText } = render(
        <Section
          header="Header"
          headerClassName="header-test"
          content={<p>Content</p>}
          contentClassName="content-test"
          // sidebar={<nav>Sidebar</nav>}
          // sidebarClassName="sidebar-test"
          actions={<button type="button">Action</button>}
          message={<span>Message</span>} />
      );
      expect(getByText('Header')).toBeDefined();
      expect(container.querySelectorAll('.header-test')).toBeDefined();
      expect(getByText('Content')).toBeDefined();
      expect(container.querySelectorAll('.content-test')).toBeDefined();
      // expect(getByText('Sidebar')).toBeDefined();
      // expect(container.querySelectorAll('.sidebar-test')).toBeDefined();
      expect(getByText('Action')).toBeDefined();
      expect(getByText('Message')).toBeDefined();
    });
  });
});
