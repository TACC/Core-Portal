import React from 'react';
import { toHaveClass } from '@testing-library/jest-dom/dist/matchers';
import DataFilesToolbar, { ToolbarButton } from './DataFilesToolbar';
import configureStore from 'redux-mock-store';
import { createMemoryHistory } from 'history';
import renderComponent from 'utils/testing';
import systemsFixture from '../fixtures/DataFiles.systems.fixture';

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
      <DataFilesToolbar scheme="private" api="tapis" />,
      mockStore({
        workbench: { config: {
          extract: '',
          compress: ''
        } },
        files: { selected: { FilesListing: [] } },
        listing: { selected: { FilesListing: [] } },
        systems: systemsFixture
      }),
      createMemoryHistory()
    );

    expect(getByText(/Rename/)).toBeDefined();
    expect(getByText(/Move/)).toBeDefined();
    expect(getByText(/Copy/)).toBeDefined();
    expect(getByText(/Download/)).toBeDefined();
    expect(getByText(/Trash/)).toBeDefined();
    expect(queryByText(/Make Public/)).toBeFalsy();
  });
});

describe('DataFilesToolbar', () => {
  it('render Make Public button', () => {
    const { getByText } = renderComponent(
      <DataFilesToolbar scheme="private" api="tapis" />,
      mockStore({
        files: { selected: { FilesListing: [] } },
        listing: { selected: { FilesListing: [] } },
        systems: systemsFixture,
        workbench: { config: { makePublic: true } }
      }),
      createMemoryHistory()
    );

    expect(getByText(/Make Public/)).toBeDefined();
  });
});
