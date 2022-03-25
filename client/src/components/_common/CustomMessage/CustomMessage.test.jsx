import React from 'react';
import { render } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';

import CustomMessage from './CustomMessage';

const mockStore = configureStore();
const store = mockStore({
  customMessages: {
    messages: [
      {
        template: {
          id: 1,
          component: 'TEST',
          message_type: 'warning',
          dismissible: true,
          message: 'Test Message',
        },
        unread: true,
      },
    ],
  },
});

describe('CustomMessage', () => {
  describe('elements', () => {
    it('renders message text, message type, and dismissability correctly', () => {
      const { container, getByText } = render(
        <Provider store={store}>
          <CustomMessage componentName="TEST"></CustomMessage>
        </Provider>
      );
      expect(container.getElementsByClassName('is-warn').length).toEqual(1);
      expect(container.getElementsByClassName('close-button').length).toEqual(
        1
      );
      expect(getByText('Test Message')).not.toEqual(null);
    });
  });
});
