import React from 'react';
import { render } from '@testing-library/react';
import { ActiveTable, InactiveTable } from '../AllocationsTables';

describe('Allocations Tables', () => {
  it('should have relevant columns for data for the Active Table', () => {
    const { getByText } = render(<ActiveTable />);
    // Columns
    expect(getByText(/Title/)).toBeDefined();
  });
  it('should have relevant columns for data for Inactive Table', () => {
    const { getByText } = render(<InactiveTable />);
    // Columns
    expect(getByText(/Alloc ID/)).toBeDefined();
  });
});
