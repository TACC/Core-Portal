import React from 'react';
import { render } from '@testing-library/react';
import SectionContent, { LAYOUT_CLASS_MAP } from './SectionContent';

// Create our own `LAYOUTS`, because component one may include an empty string
const LAYOUTS = [...Object.keys(LAYOUT_CLASS_MAP)];

export const PARAMETER_CLASS_MAP = {
  shouldScroll: 'should-scroll'
};
export const PARAMETERS = [...Object.keys(PARAMETER_CLASS_MAP)];

describe('SectionContent', () => {
  describe('elements', () => {
    it('renders all passed children', () => {
      const { container } = render(
        <SectionContent>
          <div>Thing 1</div>
          <div>Thing 2</div>
          <div>Thing 3</div>
        </SectionContent>
      );
      const root = container.children[0];

      expect(root.children.length).toEqual(3);
    });
    it('renders custom tag', () => {
      const { container } = render(
        <SectionContent tagName="main">Thing</SectionContent>
      );
      const root = container.children[0];

      expect(root.tagName.toLowerCase()).toEqual('main');
    });
  });

  describe('parameter class names', () => {
    it.each(LAYOUTS)('renders accurate class for layout name "%s"', layoutName => {
      const { container } = render(
        <SectionContent layoutName={layoutName}>Thing</SectionContent>
      );
      const className = LAYOUT_CLASS_MAP[layoutName];

      expect(container.querySelector(`[class*="${className}"]`)).toBeTruthy();
    });

    it.each(PARAMETERS)('renders accurate class for boolean parameter "%s"', parameter => {
      const parameterObj = {[parameter]: true};
      const { container } = render(
        <SectionContent
          tagName="main"
          {...parameterObj}>
          Thing
        </SectionContent>
      );
      const className = PARAMETER_CLASS_MAP[parameter];

      expect(container.querySelector(`[class*="${className}"]`)).toBeTruthy();
    });
  });
});
