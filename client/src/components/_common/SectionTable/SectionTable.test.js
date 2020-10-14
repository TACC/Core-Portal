import React from 'react';
import { render } from '@testing-library/react';

import SectionTable from './SectionTable';

const TABLE_MARKUP = <table><tbody><tr><td>Table Cell</td></tr></tbody></table>;

export const PARAMETER_CLASS_MAP = {
  shouldScroll: 'should-scroll'
};
export const PARAMETERS = [...Object.keys(PARAMETER_CLASS_MAP)];

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

  describe('parameter class names', () => {
    it.each(PARAMETERS)('renders accurate class for boolean parameter "%s"', parameter => {
      const parameterObj = {[parameter]: true};
      const { container } = render(
        <SectionTable {...parameterObj}>
          {TABLE_MARKUP}
        </SectionTable>
      );
      const className = PARAMETER_CLASS_MAP[parameter];

      expect(container.querySelector(`[class*="${className}"]`)).not.toEqual(null);
    });
  });
});
