import React from 'react';
import { render, fireEvent, waitForElementToBeRemoved } from '@testing-library/react';
import UncontrolledMessage from './UncontrolledMessage';

const TEST_CONTENT = '…';
const TEST_TYPE = 'info';

describe('UncontrolledMessage', () => {
  describe('elements', () => {
    test('dissapear when dismissed', async () => {
      const { getByRole, queryByRole } = render(
        <UncontrolledMessage
          type={TEST_TYPE}
          scope="section"
          canDismiss
        >
          {TEST_CONTENT}
        </UncontrolledMessage>
      );
      fireEvent.click(getByRole('button'));
      await waitForElementToBeRemoved(() => queryByRole('button'));
    });
  });
});
