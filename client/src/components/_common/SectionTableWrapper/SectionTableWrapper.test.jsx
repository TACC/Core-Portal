import React from 'react';
import { render } from '@testing-library/react';

import SectionTableWrapper from './SectionTableWrapper';

const TABLE_MARKUP = (
  <table>
    <tbody>
      <tr>
        <td>Table Cell</td>
      </tr>
    </tbody>
  </table>
);

export const PARAMETER_CLASS_MAP = {
  contentShouldScroll: 'should-scroll',
};
export const PARAMETERS = [...Object.keys(PARAMETER_CLASS_MAP)];

describe('SectionTableWrapper', () => {
  describe('elements', () => {
    it('renders passed children and header', () => {
      const { getByRole } = render(
        <SectionTableWrapper header="Header">
          {TABLE_MARKUP}
        </SectionTableWrapper>
      );
      expect(getByRole('table').textContent).toEqual('Table Cell');
      // NOTE: Technically (https://www.w3.org/TR/html-aria/#el-header), the `header` should not have a role, but `aria-query` recognizes it as a banner (https://github.com/A11yance/aria-query/pull/59)
      expect(getByRole('banner').textContent).toEqual('Header');
      expect(getByRole('heading').textContent).toEqual('Header');
    });
  });

  describe('content and class names', () => {
    it('renders all passed content and class names', () => {
      const { container, getByText } = render(
        <SectionTableWrapper
          className="root-test"
          header="Header"
          headerActions={<button type="button">Header Actions</button>}
          headerClassName="header-test"
        >
          {TABLE_MARKUP}
        </SectionTableWrapper>
      );
      expect(container.getElementsByClassName('root-test').length).toEqual(1);
      expect(getByText('Header')).not.toEqual(null);
      expect(getByText('Header Actions')).not.toEqual(null);
      expect(container.getElementsByClassName('header-test').length).toEqual(1);
    });
    it('renders conditional class names', () => {
      const { container } = render(
        <SectionTableWrapper>{TABLE_MARKUP}</SectionTableWrapper>
      );
      expect(container.querySelector('[class*="has-wrap"]')).not.toEqual(null);
    });
  });

  describe('parameter class names', () => {
    it.each(PARAMETERS)(
      'renders accurate class for boolean parameter "%s"',
      (parameter) => {
        const parameterObj = { [parameter]: true };
        const { container } = render(
          <SectionTableWrapper {...parameterObj}>
            {TABLE_MARKUP}
          </SectionTableWrapper>
        );
        const className = PARAMETER_CLASS_MAP[parameter];

        expect(container.querySelector(`[class*="${className}"]`)).not.toEqual(
          null
        );
      }
    );
  });
});
