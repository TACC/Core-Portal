import React from 'react';
import { render } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

import UIPatterns from './UIPatterns';

const mockStore = configureStore();
const store = mockStore({});

// UIPatternsShowMore renders a ShowMore that uses react-resize-detector,
// which needs a ResizeObserver global that jsdom doesn't provide.
const { ResizeObserver } = window;

beforeEach(() => {
  delete window.ResizeObserver;
  window.ResizeObserver = vi.fn().mockImplementation(function () {
    this.observe = vi.fn();
    this.unobserve = vi.fn();
    this.disconnect = vi.fn();
  });
});

afterEach(() => {
  window.ResizeObserver = ResizeObserver;
  vi.restoreAllMocks();
});

const renderUIPatterns = () =>
  render(
    <Provider store={store}>
      <MemoryRouter>
        <UIPatterns />
      </MemoryRouter>
    </Provider>
  );

describe('UIPatterns', () => {
  it('renders the Version 4 and Version 3 sections', () => {
    const { getByText } = renderUIPatterns();

    expect(getByText('Version 4')).toBeDefined();
    expect(getByText('Version 3')).toBeDefined();
  });

  it('renders every ShadCN button variant/size combination and disabled state', () => {
    const { getAllByText } = renderUIPatterns();

    ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'].forEach(
      (variant) => {
        // One label in the variant/size grid row, one disabled button
        expect(getAllByText(variant).length).toBeGreaterThanOrEqual(2);
      }
    );

    ['xs', 'sm', 'lg'].forEach((size) => {
      // Rendered once per variant (6 variants)
      expect(getAllByText(size)).toHaveLength(6);
    });
  });
});
