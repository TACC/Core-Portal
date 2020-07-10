import React from 'react';
import { render } from '@testing-library/react';
import MessageIcon from './MessageIcon';

const NAME = 'alert';

describe('MessageIcon', () => {
  it('has correct className', () => {
    const { getByTestId } = render(<MessageIcon name={NAME} />);
    const icon = getByTestId('icon');
    expect(icon.classList.contains(`icon-${NAME}`)).toBe(true);
  });
  it('has correct tagName', () => {
    const { getByTestId } = render(<MessageIcon name={NAME} />);
    const icon = getByTestId('icon');
    expect(icon.tagName).toEqual('I');
  });
});
