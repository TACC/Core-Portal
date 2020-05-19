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
      categoryDict: { 
        mockCategory: [
          // App definition with an icon
          {
            value: {
              definition: {
                id: "jupyter",
                appIcon: "jupyter"
              }
            }
          },
          // App definition without an icon
          {
            value: {
              definition: {
                id: "vasp"
              }
            }
          }
        ] 
      } 
    } 
  }
);

expect.extend({ toHaveAttribute });

function renderAppIcon(appId) {
  return render(
    <Provider store={store}>
      <AppIcon appId={appId} />
    </Provider>
  );
}

describe('AppIcon', () => {
  it('should render icons for known app IDs', () => {
    const { getByTestId } = renderAppIcon("jupyter");
    expect(getByTestId(/app-icon/)).toHaveAttribute(
      'class',
      'app-icon icon-nav-jupyter'
    );
  });
  it('should show generic icons for apps with no appIcon', () => {
    const { getByTestId } = renderAppIcon("vasp");
    expect(getByTestId(/app-icon/)).toHaveAttribute(
      'class',
      'app-icon icon-nav-application'
    )
  });
  it('should show generic icons for unknown apps', () => {
    const { getByTestId } = renderAppIcon("unknown");
    expect(getByTestId(/app-icon/)).toHaveAttribute(
      'class',
      'app-icon icon-nav-application'
    )
  });
  it('should render icons for prtl.clone apps', () => {
    const { getByTestId } = renderAppIcon(
      "prtl.clone.username.allocation.jupyter"
    );
    expect(getByTestId(/app-icon/)).toHaveAttribute(
      'class',
      'app-icon icon-nav-jupyter'
    )
  });
});
