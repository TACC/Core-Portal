import React from 'react';
import { render } from '@testing-library/react';
import HistoryBadge from './HistoryBadge';
import '@testing-library/jest-dom/extend-expect';

describe('History Badge', () => {
  it('renders the badge if there are unread notifs', () => {
    const { getByTestId } = render(
      <HistoryBadge unread={1}/>
    );
    expect(getByTestId('history-badge')).toBeDefined();
    expect(getByTestId('history-badge')).toHaveTextContent(/1/);
  });

  it('renders jobs', () => {
    const { queryByTestId } = render(
      <HistoryBadge unread={0}/>
    );
    expect(queryByTestId('history-badge')).toBeNull();
  });
});
