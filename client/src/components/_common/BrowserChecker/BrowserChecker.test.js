import React from 'react';
import { render } from '@testing-library/react';
import BrowserChecker from './index';

describe('Dashboard', () => {
  it('should tell the user when their browser is not supported', () => {
    // Opera
    const dummyAgent =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36 OPR/67.0.3575.53';
    Object.defineProperty(global.window.navigator, 'userAgent', {
      value: dummyAgent,
      writable: true,
    });
    const { getByText, debug } = render(<BrowserChecker />);
    expect(getByText(/Your browser is not supported./)).toBeDefined();
  });
  it('should show nothing when the browser is supported', () => {
    // Chrome
    const dummyAgent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36';
    Object.defineProperty(global.window.navigator, 'userAgent', {
      value: dummyAgent,
    });
    const { queryByText } = render(<BrowserChecker />);
    expect(queryByText(/Your browser is not supported/)).toBeNull();
  });
});
