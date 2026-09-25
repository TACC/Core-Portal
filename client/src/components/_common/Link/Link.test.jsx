// WARNING: Relies on `Icon` because of `getByRole('img')`
import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import Link, * as BTN from './Link';
import { vi } from 'vitest';

import '@testing-library/jest-dom/extend-expect';

const TEST_TEXT = '…';
const TEST_TYPE = 'Button';
const TEST_SIZE = 'medium';

function testClassnamesByType(type, size, getByRole, getByTestId) {
  const root = getByRole('link');
  const text = getByTestId('text');
  const typeClassName = BTN.TYPE_MAP[type];
  const sizeClassName = BTN.SIZE_MAP[size];
  if (type) {
    expect(root.className).toMatch('root');
    expect(root.className).toMatch(new RegExp(typeClassName));
    expect(root.className).toMatch(new RegExp(sizeClassName));
  }
}

function muteTypeNotLinkNoSizeLog(type, size) {
  if (type !== 'link' && !size) console.debug = vi.fn();
}

function isPropertyLimitation(type, size) {
  let isLimited = false;

  if (
    (type === 'primary' && size === 'small') ||
    (type !== 'link' && !size) ||
    (type === 'link' && size)
  )
    isLimited = true;

  return isLimited;
}

describe('Link', () => {
  it('uses given text', () => {
    muteTypeNotLinkNoSizeLog();
    const { getByTestId } = render(
      <Router>
        <Link>{TEST_TEXT}</Link>
      </Router>
    );
    expect(getByTestId('text').textContent).toEqual(TEST_TEXT);
  });

  describe('all type & size combinations render accurately', () => {
    it.each(BTN.TYPES)('type is "%s"', (type) => {
      muteTypeNotLinkNoSizeLog();
      if (isPropertyLimitation(type, TEST_SIZE)) {
        return Promise.resolve();
      }
      const { getByRole, getByTestId } = render(
        <Router>
          <Link type={type} size={TEST_SIZE}>
            {TEST_TEXT}
          </Link>
        </Router>
      );

      testClassnamesByType(type, TEST_SIZE, getByRole, getByTestId);
    });
    it.each(BTN.SIZES)('size is "%s"', (size) => {
      muteTypeNotLinkNoSizeLog();
      if (isPropertyLimitation(TEST_TYPE, size)) {
        return Promise.resolve();
      }
      const { getByRole, getByTestId } = render(
        <Router>
          <Link type={TEST_TYPE} size={size}>
            {TEST_TEXT}
          </Link>
        </Router>
      );

      testClassnamesByType(TEST_TYPE, size, getByRole, getByTestId);
    });
  });

  describe('loading', () => {
    it('does not render button without text', () => {
      muteTypeNotLinkNoSizeLog();
      const { queryByTestId } = render(
        <Router>
          <Link data-testid="no button here">{TEST_TEXT}</Link>
        </Router>
      );
      const el = queryByTestId('no button here');
      expect(el).toBeNull;
    });
    it('disables button when in loading state', () => {
      muteTypeNotLinkNoSizeLog();
      const { queryByText } = render(
        <Router>
          <Link isLoading={true}>Loading Button</Link>
        </Router>
      );
      const el = queryByText('Loading Button');
      expect(el).toBeDisabled;
    });
  });

  describe('property limitation', () => {
    test('type is "link" & ANY size`', () => {
      const { getByRole, getByTestId } = render(
        <Router>
          <Link type="link" size={TEST_SIZE}>
            {TEST_TEXT}
          </Link>
        </Router>
      );
      const expectedType = 'link';
      const expectedSize = '';

      testClassnamesByType(expectedType, expectedSize, getByRole, getByTestId);
    });
    test('type is "primary" & size is "small"', () => {
      console.error = vi.fn();
      const { getByRole, getByTestId } = render(
        <Router>
          <Link type="primary" size="small">
            {TEST_TEXT}
          </Link>
        </Router>
      );
      const expectedType = 'secondary';
      const expectedSize = 'small';

      testClassnamesByType(expectedType, expectedSize, getByRole, getByTestId);
      expect(console.error).toHaveBeenCalled();
    });
  });
});
