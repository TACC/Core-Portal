import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { DemoListing } from './DemoListing';

describe('Demo Component', () => {
  it('renders text', () => {
    const { getByText, getAllByRole } = render(<DemoListing name="Bob" />);
    expect(getByText(/The listing goes here and is named Bob/)).toBeDefined();
    expect(getByText(/file1/)).toBeDefined();
    expect(getAllByRole('listitem').length).toEqual(2);
  });

  it('clicking button adds text', () => {
    const { getByRole, getAllByRole } = render(<DemoListing name="Bob" />);
    const button = getByRole('button')
    expect(button).toBeDefined();
    fireEvent.click(button);
    expect(getAllByRole('listitem').length).toEqual(3);

  });
});
