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
      const { container, getByText, getByLabelText, debug } = render(
        <Provider store={store}>
          <CustomMessage messageComponentName="TEST"></CustomMessage>
        </Provider>
      );
      expect(getByLabelText('Warning')).toBeTruthy();
      expect(getByLabelText('Close')).toBeTruthy();
      expect(getByText('Test Message')).not.toEqual(null);
    });
  });
});

describe('CustomMessage edge‐cases', () => {
  it('renders nothing when customMessages.messages is undefined', () => {
    const badStore = mockStore({ customMessages: { lastFetched: Date.now() } });
    const { container } = render(
      <Provider store={badStore}>
        <CustomMessage messageComponentName="TEST" />
      </Provider>
    );
    expect(container.firstChild).toBeNull();
  });
});