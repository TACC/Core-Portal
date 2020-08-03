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
  it('should render icon for known app ID', () => {
    const { getByTestId } = renderAppIcon("jupyter", "Data Processing");
    expect(getByTestId(/icon/)).toHaveAttribute(
      'class',
      'icon icon-jupyter'
    );
  });
  it('should show category icon for apps with unknown app ID but known category ID', () => {
    const { getByTestId } = renderAppIcon("Vasp", "Data Processing");
    expect(getByTestId(/icon/)).toHaveAttribute(
      'class',
      'icon icon-data-processing'
    )
  });
  it('should show generic icon for apps with unknown app ID and unknown category ID', () => {
    const { getByTestId } = renderAppIcon("Vasp");
    expect(getByTestId(/icon/)).toHaveAttribute(
      'class',
      'icon icon-applications'
    )
  });
  it('should render icon for prtl.clone app', () => {
    const { getByTestId } = renderAppIcon(
      "prtl.clone.username.allocation.jupyter"
    );
    expect(getByTestId(/icon/)).toHaveAttribute(
      'class',
      'icon icon-jupyter'
    )
  });
});
