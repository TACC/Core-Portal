import React from 'react';
import { render } from '@testing-library/react';
import Checkbox from './Checkbox';

describe('Icon', () => {
  it('has correct `className` (when not passed `isChecked`)', () => {
    const { getByRole } = render(<Checkbox />);
    const el = getByRole('checkbox');
    expect(el.className).not.toMatch(`is-checked`);
  });
  it('has correct `className` (when passed `isChecked`)`', () => {
    const { getByRole } = render(<Checkbox isChecked />);
    const el = getByRole('checkbox');
    expect(el.className).toMatch(`is-checked`);
  });
  it('has correct `role` (when not passed `role`)', () => {
    const { getByRole } = render(<Checkbox />);
    const el = getByRole('checkbox');
    expect(el).not.toEqual(null);
  });
  it('has correct `role` (when passed `role`)', () => {
    const { getByRole } = render(<Checkbox role="button" />);
    const el = getByRole('button');
    expect(el).not.toEqual(null);
  });
});
