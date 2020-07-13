import React from 'react';
import { render } from '@testing-library/react';
import Message from './Message';

const CONTENT = '…';
const TYPE = 'info';

function testClassnamesByType(type, getByTestId) {
  const text = getByTestId('text');
  const modifierClassnamePattern = new RegExp(`is-${type}`);
  const root = getByTestId('message');
  expect(root.className).toMatch(/container/);
  expect(root.className).toMatch(modifierClassnamePattern);
  expect(text.className).toMatch(/text/);
}

describe('Message', () => {
  it('has correct text', () => {
    const { getByTestId } = render(<Message type={TYPE} text={CONTENT} />);
    const text = getByTestId('text');
    expect(text.textContent).toEqual(CONTENT);
  });

  describe('set of expected elements', () => {
    it('includes icon', () => {
      const { getByTestId } = render(<Message type={TYPE} text={CONTENT} />);
      const icon = getByTestId('icon'); // WARNING: Relies on `Icon`
      expect(icon).toBeDefined();
    });
    it('includes text', () => {
      const { getByTestId } = render(<Message type={TYPE} text={CONTENT} />);
      const text = getByTestId('text');
      expect(text).toBeDefined();
    });
  });
  
  describe('classNames', () => {
    describe('are accurate when type is:', () => {
      test('"info"', () => {
        const type = 'info';
        const { getByTestId } = render(<Message type={type} text="…" />);
        testClassnamesByType(type, getByTestId);
      });
      test('"success"', () => {
        const type = 'success';
        const { getByTestId } = render(<Message type={type} text="…" />);
        testClassnamesByType(type, getByTestId);
      });
      test('"warn"', () => {
        const type = 'warn';
        const { getByTestId } = render(<Message type={type} text="…" />);
        testClassnamesByType(type, getByTestId);
      });
      test('"error"', () => {
        const type = 'error';
        const { getByTestId } = render(<Message type={type} text="…" />);
        testClassnamesByType(type, getByTestId);
      });
    });
  });
});
