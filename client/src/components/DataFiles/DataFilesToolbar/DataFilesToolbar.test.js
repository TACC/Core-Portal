import React from 'react';
import { toHaveClass } from '@testing-library/jest-dom/dist/matchers';
import DataFilesToolbar, { ToolbarButton } from './DataFilesToolbar';
import configureStore from 'redux-mock-store';
import { createMemoryHistory } from 'history';
import renderComponent from 'utils/testing';

const mockStore = configureStore();
expect.extend({ toHaveClass });
describe('ToolbarButton', () => {
  const store = mockStore({});
  it('render button with correct text', () => {
    const { getByText, getByRole, getByTestId } = renderComponent(
      <ToolbarButton text="Rename" iconName="rename" onClick={() => {}} />,
      store,
      createMemoryHistory()
    );

    expect(getByText(/Rename/)).toBeDefined();
    expect(getByRole('button')).toBeDefined();
    expect(getByTestId('toolbar-icon')).toHaveClass('icon-action icon-rename');
  });
});

describe('DataFilesToolbar', () => {
  it('render necessary buttons', () => {
    const { getByText } = renderComponent(
      <DataFilesToolbar scheme="private" />,
      mockStore({
        files: {
          selected: { FilesListing: [] },
          params: { FilesListing: { api: 'tapis' } }
        }
      }),
      createMemoryHistory()
    );

    expect(getByText(/Rename/)).toBeDefined();
    expect(getByText(/Move/)).toBeDefined();
    expect(getByText(/Copy/)).toBeDefined();
    expect(getByText(/Download/)).toBeDefined();
    expect(getByText(/Trash/)).toBeDefined();
  });
});
