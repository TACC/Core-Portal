import React from 'react';
import { render } from '@testing-library/react';
import {
  toHaveAttribute,
  toHaveTextContent
} from '@testing-library/jest-dom/dist/matchers';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store'
import AppCategoryIcon from './AppCategoryIcon';

const mockStore = configureStore();
const store = mockStore(
  {
    apps: {
      categoryIcons: {
        Visualization: 'visualization'
      }
    }
  }
);

expect.extend({ toHaveAttribute });

function renderCategoryIcon(categoryId) {
  return render(
    <Provider store={store}>
      <AppCategoryIcon categoryId={categoryId} />
    </Provider>
  );
}

describe('AppCategoryIcon', () => {
  it('should render icon for known category name', () => {
    const { getByTestId } = renderCategoryIcon('Visualization');
    expect(getByTestId(/icon/)).toHaveAttribute(
      'class',
      'icon icon-visualization'
    );
  });
  it('should show generic icon for unknown category name', () => {
    const { getByTestId } = renderCategoryIcon('ABC');
    expect(getByTestId(/icon/)).toHaveAttribute(
      'class',
      'icon icon-applications'
    )
  });
});
