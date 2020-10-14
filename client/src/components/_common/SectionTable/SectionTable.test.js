import React from 'react';
import { render } from '@testing-library/react';

import SectionTable from './SectionTable';
import { SectionHeader } from '_common';

const TABLE_MARKUP = <table><tbody><tr><td>Table Cell</td></tr></tbody></table>;

describe('SectionTable', () => {
  describe('elements', () => {
    it('renders passed children and header', () => {
      const { getByRole } = render(
        <SectionTable
          header="Header"
        >
          {TABLE_MARKUP}
        </SectionTable>
      );
      expect(getByRole('table').textContent).toEqual('Table Cell');
      // NOTE: Technically (https://www.w3.org/TR/html-aria/#el-header), the `header` should not have a role, but `aria-query` recognizes it as a banner (https://github.com/A11yance/aria-query/pull/59)
      expect(getByRole('banner').textContent).toEqual('Header');
      expect(getByRole('heading').textContent).toEqual('Header');
    });
  });

  describe('content and classses', () => {
    it('renders all passed content and classes', () => {
      const { container, getByText } = render(
        <SectionTable
          className="root-test"
          header="Header"
          headerActions={<button type="button">Header Actions</button>}
          headerClassName="header-test"
        >
          {TABLE_MARKUP}
        </SectionTable>
      );
      expect(container.getElementsByClassName('root-test')).not.toEqual(null);
      expect(getByText('Header')).not.toEqual(null);
      expect(getByText('Header Actions')).not.toEqual(null);
      expect(container.getElementsByClassName('header-test')).not.toEqual(null);
    });
  });
});
