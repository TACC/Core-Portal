import React from 'react';
import { render } from '@testing-library/react';
import {
  toHaveAttribute,
  toHaveTextContent
} from '@testing-library/jest-dom/dist/matchers';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store'
import AppIcon from './AppIcon';

const mockStore = configureStore();
const store = mockStore(
  {
    apps: {
      appIcons: {
        "jupyter": "jupyter"
      },
      categoryIcons: {
        "Data Processing": "data-processing"
      }
    }
  }
);

expect.extend({ toHaveAttribute });

function renderAppIcon(appId, categoryId) {
  return render(
    <Provider store={store}>
      <AppIcon appId={appId} categoryId={categoryId} />
    </Provider>
  );
}

describe('AppIcon', () => {
  it('should render icons for known app IDs', () => {
    const { getByRole } = renderAppIcon("jupyter", "Data Processing");
    expect(getByRole('img')).toHaveAttribute(
      'class',
      'icon icon-jupyter'
    );
  });
  it('should show category icons for apps with unknown app ID but known category ID', () => {
    const { getByTestId } = renderAppIcon("vasp", "Data Processing");
    expect(getByTestId(/icon/)).toHaveAttribute(
      'class',
      'icon icon-data-processing'
    )
  });
  it('should show generic icons for apps with no appIcon', () => {
    const { getByRole } = renderAppIcon("vasp");
    expect(getByRole('img')).toHaveAttribute(
      'class',
      'icon icon-applications'
    )
  });
  it('should render icons for prtl.clone apps', () => {
    const { getByRole } = renderAppIcon(
      "prtl.clone.username.allocation.jupyter"
    );
    expect(getByRole('img')).toHaveAttribute(
      'class',
      'icon icon-jupyter'
    )
  });
});
