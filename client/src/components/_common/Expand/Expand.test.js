import React from 'react';
import { render } from '@testing-library/react';
import Expand from './Expand';

describe('Expand component', () => {
  it('renders job history information given the job ID', () => {
    const { getByText } = render(
      <Expand message="My message" detail="Detail header" />
    );
    expect(getByText(/My message/)).toBeDefined();
    expect(getByText(/Detail header/)).toBeDefined();
  });
});
