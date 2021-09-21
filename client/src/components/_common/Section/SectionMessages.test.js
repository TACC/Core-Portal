import React from 'react';
import { render } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { Alert } from 'reactstrap';

import SectionMessages from './SectionMessages';
import * as MESSAGES from '../../../constants/messages';

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

  describe('weclome message', () => {
    it('renders known intro message', () => {
      const { getByText } = render(
        <Provider store={store}>
          <SectionMessages introMessageName="DASHBOARD" />
        </Provider>
      );
      expect(getByText(MESSAGES['DASHBOARD'])).not.toEqual(null);
    });

    it('renders known intro message but with custom message', () => {
      const { getByText, queryByText } = render(
        <Provider store={store}>
          <SectionMessages
            introMessageName="DASHBOARD"
            introMessageText="Hello"
          />
        </Provider>
      );
      expect(queryByText(MESSAGES['DASHBOARD'])).toEqual(null);
      expect(getByText('Hello')).not.toEqual(null);
    });

    it('renders custom intro message', () => {
      const { getByText } = render(
        <Provider store={store}>
          <SectionMessages introMessageText="Hello" />
        </Provider>
      );
      expect(getByText('Hello')).not.toEqual(null);
    });
  });
});
