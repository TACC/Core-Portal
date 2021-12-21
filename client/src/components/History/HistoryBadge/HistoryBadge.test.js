import React from 'react';
import { render } from '@testing-library/react';
import HistoryBadge from './HistoryBadge';
import '@testing-library/jest-dom/extend-expect';

describe('History Badge', () => {
  it('renders the badge if there are unread notifs', () => {
    const { getByRole } = render(<HistoryBadge unread={1} />);
    expect(getByRole('status')).toBeDefined();
    expect(getByRole('status')).toHaveTextContent(/1/);
  });

  it('renders jobs', () => {
    const { queryByRole } = render(<HistoryBadge unread={0} />);
    expect(queryByRole('status')).toBeNull();
  });
});
