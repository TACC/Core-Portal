import React from 'react';
import { render } from '@testing-library/react';
import DataFilesSearchbarStatus, { createMessage } from './DataFilesSearchbarStatus';

const mockQuery = 'test_query';

describe('DataFilesSearchbarStatus', () => {
  it('is accurate when count is greater than zero', () => {
    const count = 100;
    const query = mockQuery;
    const statusMessage = createMessage(count, query);
    const { getByText } = render(
      <DataFilesSearchbarStatus {...{ count, query }} />
    );
    const message = getByText(statusMessage);

    // FAQ: `toMatch` requires string (or regex)
    expect(message.textContent).toMatch(`${count}`);
    expect(message.textContent).toMatch(query);
  });
  it('is empty when count is zero', () => {
    const count = 0;
    const query = mockQuery;
    const { container } = render(
      <DataFilesSearchbarStatus {...{ count, query }} />
    );

    expect(container.textContent).toMatch('');
  });
});
