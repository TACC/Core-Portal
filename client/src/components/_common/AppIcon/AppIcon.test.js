import React from 'react';
import { render } from '@testing-library/react';
import {
  toHaveAttribute,
  toHaveTextContent,
} from '@testing-library/jest-dom/dist/matchers';
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
    'test-apps': ['vasp'],
    'data-processing': ['jupyter'],
  },
});

expect.extend({ toHaveAttribute });

function renderAppIcon(appId, category = 'default') {
  return render(
    <Provider store={store}>
      <AppIcon appId={appId} category={category} />
    </Provider>
  );
}

describe('AppIcon', () => {
  it('should render icons for known app IDs', () => {
    const { getByRole } = renderAppIcon('jupyter', 'data-processing');
    expect(getByRole('img')).toHaveAttribute('class', 'icon icon-jupyter');
  });
  it('should show category icons for apps with no appIcon', () => {
    const { getByRole } = renderAppIcon('vasp', 'test-apps');
    expect(getByRole('img')).toHaveAttribute('class', 'icon icon-test-apps');
  });
  it('should render icons for prtl.clone apps', () => {
    const { getByRole } = renderAppIcon(
      'prtl.clone.username.allocation.jupyter'
    );
    expect(getByRole('img')).toHaveAttribute('class', 'icon icon-jupyter');
  });
  it('should render icon for zippy toolbar app', () => {
    const { getByRole } = renderAppIcon(
      'prtl.clone.username.FORK.zippy-0.2u2-2.0'
    );
    expect(getByRole('img')).toHaveAttribute('class', 'icon icon-compress');
  });
  it('should render icon for extract toolbar app', () => {
    const { getByRole } = renderAppIcon(
      'prtl.clone.username.FORK.extract-0.1u7-7.0'
    );
    expect(getByRole('img')).toHaveAttribute('class', 'icon icon-extract');
  });
});
