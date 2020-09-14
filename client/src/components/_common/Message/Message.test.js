import React from 'react';
import { render } from '@testing-library/react';
import Message, { TYPE_ICON_MAP } from './Message';

const TEST_CONTENT = '…';
const TYPES = Object.keys(TYPE_ICON_MAP);

function testClassnamesByType(type, getByRole, getByTestId) {
  const root = getByRole('status');
  const icon = getByRole('img'); // WARNING: Relies on `Icon`
  const text = getByTestId('text');
  const modifierClassnamePattern = new RegExp(`is-${type}`);
  const iconName = TYPE_ICON_MAP[type].name;
  expect(root.className).toMatch('container');
  expect(root.className).toMatch(modifierClassnamePattern);
  expect(icon.className).toMatch(iconName);
  expect(text.className).toMatch('text');
}

describe('Message', () => {
  it.each(TYPES)('has correct text for type %s', type => {
    const { getByTestId } = render(<Message type={type}>{TEST_CONTENT}</Message>);
    expect(getByTestId('text').textContent).toEqual(TEST_CONTENT);
  });

  describe('elements', () => {
    it.each(TYPES)('include icon when type is %s', type => {
      const { getByRole } = render(<Message type={type}>{TEST_CONTENT}</Message>);
      expect(getByRole('img')).toBeDefined(); // WARNING: Relies on `Icon`
    });
    it.each(TYPES)('include text when type is %s', type => {
      const { getByTestId } = render(<Message type={type}>{TEST_CONTENT}</Message>);
      expect(getByTestId('text')).toBeDefined();
    });
  });

  describe('className', () => {
    it.each(TYPES)('is accurate when type is %s', type => {
      const { getByRole, getByTestId } = render(<Message type={type}>{TEST_CONTENT}</Message>);
      testClassnamesByType(type, getByRole, getByTestId);
    });
  });
});
