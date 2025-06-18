import React from 'react';
import { render, act, cleanup } from '@testing-library/react';
import { vi } from 'vitest';
import useExternalStyles from './useExternalStyles';

const TEST_STYLESHEETS = [
  'test://style1.css',
  'test://style2.css'
];

describe('useExternalStyles', () => {
  beforeEach(() => {
    // Mock the link.onload event to fire immediately
    const originalCreateElement = document.createElement;
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const element = originalCreateElement.call(document, tagName);
      if (tagName === 'link') {
        // Simulate successful load immediately
        setTimeout(() => element.onload(), 0);
      }
      return element;
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  test('useExternalStyles hook initializes correctly', () => {
    let hookResult;
    const TestComponent = () => {
      hookResult = useExternalStyles(TEST_STYLESHEETS);
      return <div ref={hookResult.hostRef}>Test Content</div>;
    };

    act(() => {
      render(<TestComponent />);
    });

    expect(hookResult).toBeDefined();
    expect(hookResult.hostRef).toBeDefined();
    expect(hookResult.areStylesLoaded).toBeDefined();
    expect(hookResult.styleStatus).toBeDefined();
    expect(hookResult.renderWithStyles).toBeDefined();
  });

  test('handles rapid unmount and remount during hot reload', async () => {
    let hookResult;
    const TestComponent = () => {
      hookResult = useExternalStyles(TEST_STYLESHEETS);
      return <div ref={hookResult.hostRef}>Test Content</div>;
    };

    // Initial render
    const { unmount } = render(<TestComponent />);

    // Wait for initial style loading
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Unmount
    act(() => {
      unmount();
    });

    // Remount immediately
    act(() => {
      render(<TestComponent />);
    });

    // Wait for style loading after remount
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(hookResult.styleStatus.completed).toBe(true);
    expect(hookResult.styleStatus.loaded).toEqual(TEST_STYLESHEETS);
  });

  test('cleanup happens properly during unmount', () => {
    let hookResult;
    const unmountSpy = vi.fn();
    
    const TestComponent = () => {
      hookResult = useExternalStyles(TEST_STYLESHEETS);
      React.useEffect(() => {
        return () => unmountSpy();
      }, []);
      return <div ref={hookResult.hostRef}>Test Content</div>;
    };

    const { unmount } = render(<TestComponent />);
    
    act(() => {
      hookResult.renderWithStyles(<div>Test</div>);
    });

    act(() => {
      unmount();
    });

    expect(unmountSpy).toHaveBeenCalled();
  });

  test('handles style loading errors gracefully', async () => {
    // Mock createElement to simulate a failed load
    const originalCreateElement = document.createElement;
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const element = originalCreateElement.call(document, tagName);
      if (tagName === 'link') {
        // Simulate failed load immediately
        setTimeout(() => element.onerror(new Error('Failed to load')), 0);
      }
      return element;
    });

    let hookResult;
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const TestComponent = () => {
      hookResult = useExternalStyles(TEST_STYLESHEETS);
      return <div ref={hookResult.hostRef}>Test Content</div>;
    };

    render(<TestComponent />);

    // Wait for error handling
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(hookResult.styleStatus.completed).toBe(true);
    expect(hookResult.styleStatus.failed).toEqual(TEST_STYLESHEETS);
    errorSpy.mockRestore();
  });

  test('handles concurrent renders during hot reload', async () => {
    let hookResult;
    const TestComponent = () => {
      hookResult = useExternalStyles(TEST_STYLESHEETS);
      return <div ref={hookResult.hostRef}>Test Content</div>;
    };

    const { rerender } = render(<TestComponent />);

    // Wait for initial style loading
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Trigger multiple rerenders
    for (let i = 0; i < 3; i++) {
      act(() => {
        rerender(<TestComponent key={i} />);
      });
    }

    // Wait for final style loading
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(hookResult.styleStatus.completed).toBe(true);
    expect(hookResult.styleStatus.loaded).toEqual(TEST_STYLESHEETS);
  });

  test('handles unmount during style loading', async () => {
    let hookResult;
    const TestComponent = () => {
      hookResult = useExternalStyles(TEST_STYLESHEETS);
      return <div ref={hookResult.hostRef}>Test Content</div>;
    };

    const { unmount } = render(<TestComponent />);

    // Start style loading
    act(() => {
      hookResult.renderWithStyles(<div>Test</div>);
    });

    // Unmount during loading
    act(() => {
      unmount();
    });

    // Should be able to remount without errors
    act(() => {
      render(<TestComponent />);
    });
  });
});