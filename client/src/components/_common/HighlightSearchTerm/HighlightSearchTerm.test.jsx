import React from 'react';
import { render } from '@testing-library/react';
import {
  toBeInTheDocument,
  toHaveClass,
  toBeNull,
} from '@testing-library/jest-dom';

import HighlightSearchTerm from './HighlightSearchTerm';

describe('HighlightSearchTerm Component', () => {
  it('renders content when searchTerm is not provided', () => {
    const { getByText } = render(<HighlightSearchTerm content="Lorem ipsum" />);
    expect(getByText('Lorem ipsum')).toBeInTheDocument();
  });

  it('renders without highlighting when searchTerm in content do not match', () => {
    const { getByText } = render(
      <HighlightSearchTerm
        searchTerm="minim"
        content="Lorem ipsum dolor sit amet"
      />
    );
    expect(getByText('Lorem ipsum dolor sit amet')).toBeInTheDocument();
    expect(document.querySelector('.highlight')).toBeNull();
  });

  it('renders content when searchTerm is not provided', () => {
    const { getByText } = render(<HighlightSearchTerm content="Lorem ipsum" />);
    expect(getByText('Lorem ipsum')).toBeInTheDocument();
  });

  it('renders content with searchTerm highlighted', () => {
    const { getByText } = render(
      <HighlightSearchTerm
        searchTerm="ipsum"
        content="Lorem ipsum dolor sit amet"
      />
    );
    const highlightedText = getByText('ipsum');
    expect(highlightedText.className).toContain('highlight');
  });

  it('renders content with multiple searchTerm occurrences highlighted', () => {
    const { getAllByText } = render(
      <HighlightSearchTerm
        searchTerm="ipsum"
        content="Lorem ipsum ipsum Loremipsum ipsumipsum dolor sit amet"
      />
    );
    const highlightedText = getAllByText('ipsum');
    expect(highlightedText.length).toBe(5);
    highlightedText.forEach((element) => {
      expect(element.className).toContain('highlight');
    });
  });
});
