import React from 'react';
import { render } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { Alert } from 'reactstrap';

import SectionMessages from './SectionMessages';

const mockStore = configureStore();
const store = mockStore({});

describe('SectionMessages', () => {
  describe('content and classes', () => {
    it('renders passed children and class', () => {
      const { container, getByText } = render(
        <Provider store={store}>
          <SectionMessages className="root-test">
            <Alert>Message 1</Alert>
            <Alert>Message 2</Alert>
          </SectionMessages>
        </Provider>
      );

      expect(getByText('Message 1')).not.toEqual(null);
      expect(getByText('Message 2')).not.toEqual(null);
      expect(container.getElementsByClassName('root-test').length).toEqual(1);
    });
  });

  describe('custom messages', () => {
    it('renders custom intro message', () => {
      const { getByText, queryByText } = render(
        <Provider store={store}>
          <SectionMessages
            messageComponentName="DASHBOARD"
            introMessageText="Hello"
          />
        </Provider>
      );
      expect(getByText('Hello')).not.toEqual(null);
    });
  });
});
