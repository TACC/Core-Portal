import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import HistoryRoutes from './HistoryRoutes';

describe('History Routes', () => {
  it('should render a wrapper for the history routes', () => {
    const { getByTestId } = render(
      <BrowserRouter>
          <HistoryRoutes />
      </BrowserRouter>
    );
    expect(getByTestId(/history-router/)).toBeDefined();
  });
});
