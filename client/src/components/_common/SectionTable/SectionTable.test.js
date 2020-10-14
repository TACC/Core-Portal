import React from 'react';
import { render } from '@testing-library/react';

import SectionTable from './SectionTable';
import { SectionHeader } from '_common';

const TABLE_MARKUP = <table><tbody><tr><td>Table Cell</td></tr></tbody></table>;

describe('SectionTable', () => {
  describe('elements', () => {
    it('renders passed children and header', () => {
      const { getByText } = render(
        <SectionTable
          header={<SectionHeader>Heading</SectionHeader>}
        >
          {TABLE_MARKUP}
        </SectionTable>
      );
      expect(getByText('Table Cell')).not.toEqual(null);
      expect(getByText('Heading')).not.toEqual(null);
    });
  });
});
