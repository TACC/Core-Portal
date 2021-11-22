import React from 'react';
import { render } from '@testing-library/react';
import Button, { TYPES, DEFAULT_TYPE } from './Button';

const TEST_CONTENT = '…';
const TEST_TYPE = 'primary';
const TEST_ICON_NAME = 'primary';

function testClassnamesByType(type, getByTestId) {
  type = type || DEFAULT_TYPE;

  const root = getByTestId('button');
  const text = getByTestId('text');
  const modifierClassnamePattern = new RegExp(`btn-${type}`);
  expect(root.className).toMatch('container');
  expect(root.className).toMatch(modifierClassnamePattern);
  expect(text.className).toMatch('text');
}

describe('Button', () => {
  it('has correct text', () => {
    const { getByTestId } = render(<Button type={TEST_TYPE}>{TEST_CONTENT}</Button>);
    expect(getByTestId('text')).toBeDefined();
    expect(getByTestId('text').textContent).toEqual(TEST_CONTENT);
  });

  describe('elements', () => {
    it('include "after" icon when name is passed', () => {
      const { getByTestId } = render(<Button iconAfterName={TEST_ICON_NAME}>{TEST_CONTENT}</Button>);
      expect(getByTestId('icon-after')).toBeDefined();
    });
    it('include "before" icon when name is passed', () => {
      const { getByTestId } = render(<Button iconBeforeName={TEST_ICON_NAME}>{TEST_CONTENT}</Button>);
      expect(getByTestId('icon-before')).toBeDefined();
    });
  });

  describe('className', () => {
    it.each(TYPES)('is accurate when type is "%s"', type => {
      const { getByTestId } = render(<Button type={type}>{TEST_CONTENT}</Button>);
      testClassnamesByType(type, getByTestId);
    });
    it.each(TYPES)('is accurate when color (deprecated attribute) is "%s"', color => {
      const { getByTestId } = render(<Button color={color}>{TEST_CONTENT}</Button>);
      testClassnamesByType(color, getByTestId);
    });
  });
});
