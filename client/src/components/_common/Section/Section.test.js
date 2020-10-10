import React from 'react';
import { render } from '@testing-library/react';
import Section from './Section';

export const PARAMETER_CLASS_MAP = {
  contentShouldScroll: 'should-scroll'
};
export const PARAMETERS = [...Object.keys(PARAMETER_CLASS_MAP)];

describe('Section', () => {
  describe('elements and classes', () => {
    it('renders elements with appropriate roles', () => {
      const { getByRole } = render(<Section header="Header" content={<p>Content</p>} />);
      // WARNING: Only one `main` is allowed per page
      expect(getByRole('main').textContent).toEqual('Content');
      // NOTE: Technically (https://www.w3.org/TR/html-aria/#el-header), the `header` should not have a role, but `aria-query` recognizes it as a banner (https://github.com/A11yance/aria-query/pull/59)
      expect(getByRole('banner').textContent).toEqual('Header');
      expect(getByRole('heading').textContent).toEqual('Header');
    });
  });

  describe('content and classses', () => {
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
      expect(getByText('Header')).not.toEqual(null);
      expect(container.querySelectorAll('.header-test')).not.toEqual(null);
      expect(getByText('Content')).not.toEqual(null);
      expect(container.querySelectorAll('.content-test')).not.toEqual(null);
      // expect(getByText('Sidebar')).not.toEqual(null);
      // expect(container.querySelectorAll('.sidebar-test')).not.toEqual(null);
      expect(getByText('Action')).not.toEqual(null);
      expect(getByText('Message')).not.toEqual(null);
    });
  });

  describe('parameter class names', () => {
    it.each(PARAMETERS)('renders accurate class for boolean parameter "%s"', parameter => {
      const parameterObj = {[parameter]: true};
      const { container } = render(
        <Section
          header="Header"
          content="Content"
          {...parameterObj}>
          Thing
        </Section>
      );
      const className = PARAMETER_CLASS_MAP[parameter];

      expect(container.querySelector(`[class*="${className}"]`)).not.toEqual(null);
    });
  });
});
