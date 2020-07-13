import React from 'react';
import { render } from '@testing-library/react';
import Icon from './Icon';

const NAME = 'test-icon-name';
const CLASS = 'test-class-name';
const TEXT = 'test-icon-text';

describe('Icon', () => {
  it('has correct `className (when not passed a `className`)`', () => {
    const { getByTestId } = render(<Icon name={NAME} />);
    const icon = getByTestId('icon');
    expect(icon.className).toMatch(`icon-${NAME}`);
  });
  it('has correct `className` (when passed a `className`)', () => {
    const { getByTestId } = render(<Icon name={NAME} className={CLASS} />);
    const icon = getByTestId('icon');
    expect(icon.className).toMatch(`icon-${NAME}`);
    expect(icon.className).toMatch(CLASS);
  });
  it('has correct `tagName`', () => {
    const { getByTestId } = render(<Icon name={NAME} />);
    const icon = getByTestId('icon');
    expect(icon.tagName).toEqual('I');
  });
  it('has text', () => {
    const { getByTestId } = render(<Icon name={NAME}>{TEXT}</Icon>);
    const icon = getByTestId('icon');
    expect(icon.textContent).toEqual(TEXT);
  });
});
