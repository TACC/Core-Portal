import React from 'react';
import { render } from '@testing-library/react';
import Section from './Section';

describe('Section', () => {
  describe('elements', () => {
    it('includes main', type => {
      const { getByRole } = render(<Section header={<h2>Header</h2>} content={<p>Content</p>} />);
      // WARNING: Only one `main` is allowed per page
      expect(getByRole('main')).toBeDefined();
    });
    it('includes a group, not include banner', type => {
      const { getByRole } = render(<Section header={<h2>Header</h2>} content={<p>Content</p>} />);
      // FAQ: The header should always contain page-specific content (heading, navigation, widgets);
      //      it should never contain site-oriented content
      // SEE: https://www.w3.org/TR/html-aria/#el-header
      expect(getByRole('banner')).toBeUndefined();
      // SEE: https://www.w3.org/TR/html-aria/#index-aria-group
      expect(getByRole('group')).toBeDefined();
    });
  });

  describe('content', () => {
    it('renders all passed content', type => {
      const { getByText } = render(
        <Section
          header={<h2>Header</h2>}
          content={<p>Content</p>}
          actions={<button type="button">Action</button>}
          externals={<dialog>Modal</dialog>}
          messages={<span>Message</span>} />
      );
      expect(getByText('Header')).toBeDefined();
      expect(getByText('Content')).toBeDefined();
      expect(getByText('Action')).toBeDefined();
      expect(getByText('Modal')).toBeDefined();
      expect(getByText('Message')).toBeDefined();
    });
  });
});
