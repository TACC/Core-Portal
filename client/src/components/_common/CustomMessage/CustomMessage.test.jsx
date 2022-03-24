import React from 'react';
import { render } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';

import CustomMessage from './CustomMessage';

const mockStore = configureStore();
const store = mockStore({});

describe('CustomMessage', () => {
  describe('elements', () => {
    it('includes class, message, and role appropriately', () => {
      const { container, getByRole, getByText } = render(
        <Provider store={store}>
          <CustomMessage componentName="TEST">
            <p>Test Message</p>
          </CustomMessage>
        </Provider>
      );
      expect(container.getElementsByClassName('test-class').length).toEqual(1);
      // NOTE: The `status` role (https://www.w3.org/TR/html-aria/#index-aria-status) is more appropriate than the `alert` role (https://www.w3.org/TR/html-aria/#index-aria-alert), but setting the `role` attribute of an `Alert` is ineffectual
      expect(getByRole('alert')).not.toEqual(null);
      expect(getByText('Test Message')).not.toEqual(null);
    });
  });
});
