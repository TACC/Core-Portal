import { render } from '@testing-library/react';
import renderHtml from './renderHtml';

describe('renderHtml', () => {
  it('renders html safely', () => {
    const htmlString = "<div>Rendered Text</div><iframe src='javascript:Error('error') />";
    const { getByText } = render(renderHtml(htmlString));
    expect(getByText(/Rendered Text/)).toBeDefined();
  });
})

