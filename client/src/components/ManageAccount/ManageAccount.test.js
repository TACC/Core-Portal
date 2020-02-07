import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ManageAccountPage from './index';

describe('Manage Account Page', () => {
  it('should tell the user what page they\'re viewing', () => {
    const { getByText } = render(<BrowserRouter><ManageAccountPage /></BrowserRouter>);
    expect(getByText(/Manage Account/)).toBeDefined();
  });
  it.todo('should have a required information section');
})
