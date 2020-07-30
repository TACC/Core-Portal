import React from 'react';
import { render } from '@testing-library/react';
import DescriptionList, { LAYOUTS } from './DescriptionList';

describe('Description List', () => {
  it.each(LAYOUTS)('has accurate tag and attributes when layout is "%s"', layout => {
    const { getByTestId } = render(<DescriptionList layout={layout} />);
    const root = getByTestId('selector');
    expect(root).toBeDefined();
    expect(root.tagName).toEqual('DL');
    if (layout === 'inline') {
      expect(root.getAttribute('multiple')).toBe(''); // i.e. true
    } else {
      expect(root.getAttribute('multiple')).toBe(null); // i.e. false
    }
  });
});
