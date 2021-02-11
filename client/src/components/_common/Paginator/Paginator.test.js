import React from 'react';
import { render } from '@testing-library/react';
import Paginator from './Paginator';

describe('Paginator', () => {
  it('renders pages', () => {
    const { getAllByText } = render(<Paginator pages={20} current={11} />);
    expect(getAllByText('1')).toBeDefined();
    expect(getAllByText('9')).toBeDefined();
    expect(getAllByText('10')).toBeDefined();
    expect(getAllByText('11')).toBeDefined();
    expect(getAllByText('12')).toBeDefined();
    expect(getAllByText('13')).toBeDefined();
    expect(getAllByText('...')).toBeDefined();
    expect(getAllByText('20')).toBeDefined();
  });
});
