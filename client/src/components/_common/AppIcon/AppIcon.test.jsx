import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import AppIcon from './AppIcon';

const mockStore = configureStore();
const store = mockStore({
  apps: {
    appIcons: {
      jupyter: 'jupyter',
    },
  },
  categories: {
    visualization: ['vasp'],
    'data-processing': ['jupyter'],
  },
});

// Mock document.styleSheets to simulate the existence of the CSS classes we're testing for
Object.defineProperty(document, 'styleSheets', {
  value: [
    {
      cssRules: [
        { selectorText: '.icon-jupyter::before' },
        { selectorText: '.icon-visualization::before' },
        { selectorText: '.icon-compress::before' },
        { selectorText: '.icon-extract::before' },
      ],
    },
  ],
  writable: true,
});

function renderAppIcon(appId, category = 'default') {
  return render(
    <Provider store={store}>
      <AppIcon
        appId={appId}
        category={category}
        appIcons={store.getState().apps.appIcons}
      />
    </Provider>
  );
}

describe.skip('AppIcon', () => {
  it.skip('should render icons for known app IDs', () => {
    const { container } = renderAppIcon('jupyter', 'data-processing');
    expect(container.firstChild.className).toBe(false);
  });

  it.skip('should show category icons for apps with no appIcon', () => {
    const { container } = renderAppIcon('vasp', 'visualization');
    expect(container.firstChild).toHaveClass('icon-visualization');
  });

  it.skip('should render icons for prtl.clone apps', () => {
    const { container } = renderAppIcon(
      'prtl.clone.username.allocation.jupyter'
    );
    expect(container.firstChild).toHaveClass('icon-jupyter');
  });

  it.skip('should render icon for zippy toolbar app', () => {
    const { container } = renderAppIcon(
      'prtl.clone.username.FORK.zippy-0.2u2-2.0'
    );
    expect(container.firstChild).toHaveClass('icon-compress');
  });

  it.skip('should render icon for extract toolbar app', () => {
    const { container } = renderAppIcon(
      'prtl.clone.username.FORK.extract-0.1u7-7.0'
    );
    expect(container.firstChild).toHaveClass('icon-extract');
  });
});
