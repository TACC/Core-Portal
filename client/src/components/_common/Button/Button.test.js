import React from 'react';
import { render } from '@testing-library/react';
import Button from './Button';

describe('Button', () => {
  it('does not render button without text', () => {
    const { queryByTestId } = render(
      <Button data-testid="no button here"></Button>
    );
    const el = queryByTestId('no button here');
    expect(el).toBeNull;
  });
});
