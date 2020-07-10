import React from 'react';
import { render } from '@testing-library/react';
import Icon from './Icon';

const NAME = 'alert';

describe('Icon', () => {
  it('has correct className', () => {
    const { getByTestId } = render(<Icon name={NAME} />);
    const icon = getByTestId('icon');
    expect(icon.classList.contains(`icon-${NAME}`)).toBe(true);
  });
  it('has correct tagName', () => {
    const { getByTestId } = render(<Icon name={NAME} />);
    const icon = getByTestId('icon');
    expect(icon.tagName).toEqual('I');
  });
});
