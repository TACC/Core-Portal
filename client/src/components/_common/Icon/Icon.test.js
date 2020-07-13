import React from 'react';
import { render } from '@testing-library/react';
import Icon from './Icon';

const NAME = 'alert';
const CLASS = 'test';

describe('Icon', () => {
  it('has correct `className (when not passed a `className`)`', () => {
    const { getByTestId } = render(<Icon name={NAME} />);
    const icon = getByTestId('icon');
    expect(icon.classList.contains(`icon-${NAME}`)).toBe(true);
  });
  it('has correct `className` (when passed a `className`)', () => {
    const { getByTestId } = render(<Icon name={NAME} className={CLASS} />);
    const icon = getByTestId('icon');
    expect(icon.classList.contains(`icon-${NAME}`)).toBe(true);
    expect(icon.classList.contains(CLASS)).toBe(true);
  });
  it('has correct `tagName`', () => {
    const { getByTestId } = render(<Icon name={NAME} />);
    const icon = getByTestId('icon');
    expect(icon.tagName).toEqual('I');
  });
});
