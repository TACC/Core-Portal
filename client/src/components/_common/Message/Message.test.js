import React from 'react';
import { render } from '@testing-library/react';
import Message from './Message';

function testClassnamesByType( type ) {
  const { container, getByTestId } = render(<Message type={type} text="…" />);
  const text = getByTestId('text');
  const modifierClassname = new RegExp(`${type}`);
  expect(container.className).toMatch(/root/);
  expect(container.className).toMatch(modifierClassname);
  expect(text.className).toMatch(/text/);
}

describe('Message', () => {
  test('has correct text', () => {
    const content = '…';
    const { getByTestId } = render(<Message type={type} text={content} />);
    const node = getByTestId('text');
    expect(node.innerText).toEqual(content);
  });

  describe('elements', () => {
    test('exist', () => {
      const { container, getByTestId } = render(<Message type={type} text="…" />);
      const icon = getByTestId('icon');
      const text = getByTestId('text');
      expect(icon).toBeDefined();
      expect(text).toBeDefined();
    });
  });

  describe('classNames', () => {
    describe('match when type', () => {
      test('is "info"', testClassnamesByType('info'));
      test('is "warn"', testClassnamesByType('info'));
      test('is "error"', testClassnamesByType('info'));
    });
  });
});
