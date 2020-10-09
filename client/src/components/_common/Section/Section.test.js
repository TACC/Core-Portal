import React from 'react';
import { render } from '@testing-library/react';
import Section from './Section';

describe('Section', () => {
  describe('elements', () => {
    it('includes content, header, and heading appropriately', () => {
      const { getByRole } = render(<Section header="Header" content={<p>Content</p>} />);
      // WARNING: Only one `main` is allowed per page
      expect(getByRole('main').textContent).toEqual('Content');
      // NOTE: Technically (https://www.w3.org/TR/html-aria/#el-header), the `header` should not have a role, but `aria-query` recognizes it as a banner (https://github.com/A11yance/aria-query/pull/59)
      expect(getByRole('banner').textContent).toEqual('Header');
      expect(getByRole('heading').textContent).toEqual('Header');
    });
  });

  describe('content', () => {
    it('renders all passed content', () => {
      const { getByText } = render(
        <Section
          header="Header"
          content={<p>Content</p>}
          actions={<button type="button">Action</button>}
          messages={<span>Message</span>} />
      );
      expect(getByText('Header')).toBeDefined();
      expect(getByText('Content')).toBeDefined();
      expect(getByText('Action')).toBeDefined();
      expect(getByText('Message')).toBeDefined();
    });
  });
});
