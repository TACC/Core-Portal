import React from 'react';
import {
  toHaveClass,
  toBeDisabled,
} from '@testing-library/jest-dom/dist/matchers';
import DataFilesToolbar, { ToolbarButton } from './DataFilesToolbar';
import configureStore from 'redux-mock-store';
import { createMemoryHistory } from 'history';
import renderComponent from 'utils/testing';
import systemsFixture from '../fixtures/DataFiles.systems.fixture';

const mockStore = configureStore();
expect.extend({ toHaveClass, toBeDisabled });
describe('ToolbarButton', () => {
  const store = mockStore({});
  it('renders button with correct text', () => {
    const { getByText, getByRole, getByTestId } = renderComponent(
      <ToolbarButton text="Rename" iconName="rename" onClick={() => {}} />,
      store,
      createMemoryHistory()
    );

    expect(getByText(/Rename/)).toBeDefined();
    expect(getByRole('button')).toBeDefined();
    expect(getByTestId('icon-before').classList).toContain('icon-rename');
  });
});

describe('DataFilesToolbar', () => {
  it('renders necessary buttons', () => {
    const { getByText } = renderComponent(
      <DataFilesToolbar scheme="private" api="tapis" />,
      mockStore({
        workbench: {
          config: {
            extract: '',
            compress: '',
          },
        },
        files: {
          params: {
            FilesListing: {
              path: '',
            },
          },
          selected: { FilesListing: [] },
          operationStatus: { trash: false },
        },
        listing: { selected: { FilesListing: [] } },
        systems: systemsFixture,
        projects: { metadata: [] },
        authenticatedUser: { user: { username: 'testuser' } },
      }),
      createMemoryHistory()
    );

    expect(getByText(/Rename/)).toBeDefined();
    expect(getByText(/Move/)).toBeDefined();
    expect(getByText(/Copy/)).toBeDefined();
    expect(getByText(/Download/)).toBeDefined();
    expect(getByText(/Trash/)).toBeDefined();
  });

  it('does not render unnecessary buttons in Community Data', () => {
    const { getByText, queryByText } = renderComponent(
      <DataFilesToolbar scheme="community" api="tapis" />,
      mockStore({
        workbench: {
          config: {
            extract: '',
            compress: '',
          },
        },
        files: {
          params: {
            FilesListing: {
              path: '',
            },
          },
          selected: { FilesListing: [] },
          operationStatus: { trash: false },
        },
        listing: { selected: { FilesListing: [] } },
        systems: systemsFixture,
        projects: { metadata: [] },
        authenticatedUser: { user: { username: 'testuser' } },
      }),
      createMemoryHistory()
    );

    expect(queryByText(/Rename/)).toBeFalsy();
    expect(queryByText(/Move/)).toBeFalsy();
    expect(getByText(/Copy/)).toBeDefined();
    expect(getByText(/Download/)).toBeDefined();
    expect(queryByText(/Trash/)).toBeFalsy();
  });

  it('does not render unnecessary buttons in Public Data', () => {
    const { getByText, queryByText } = renderComponent(
      <DataFilesToolbar scheme="public" api="tapis" />,
      mockStore({
        workbench: {
          config: {
            extract: '',
            compress: '',
          },
        },
        files: {
          params: {
            FilesListing: {
              path: '',
            },
          },
          selected: { FilesListing: [] },
          operationStatus: { trash: false },
        },
        listing: { selected: { FilesListing: [] } },
        systems: systemsFixture,
        projects: { metadata: [] },
        authenticatedUser: { user: { username: 'testuser' } },
      }),
      createMemoryHistory()
    );

    expect(queryByText(/Rename/)).toBeFalsy();
    expect(queryByText(/Move/)).toBeFalsy();
    expect(getByText(/Copy/)).toBeDefined();
    expect(getByText(/Download/)).toBeDefined();
    expect(queryByText(/Trash/)).toBeFalsy();
  });

  it('does not render unnecessary buttons in Google Drive', () => {
    const { getByText, queryByText } = renderComponent(
      <DataFilesToolbar scheme="private" api="googledrive" />,
      mockStore({
        workbench: {
          config: {
            extract: '',
            compress: '',
          },
        },
        files: {
          params: {
            FilesListing: {
              path: '',
            },
          },
          selected: { FilesListing: [] },
          operationStatus: { trash: false },
        },
        listing: { selected: { FilesListing: [] } },
        systems: systemsFixture,
        projects: { metadata: [] },
        authenticatedUser: { user: { username: 'testuser' } },
      }),
      createMemoryHistory()
    );

    expect(queryByText(/Rename/)).toBeFalsy();
    expect(queryByText(/Move/)).toBeFalsy();
    expect(getByText(/Copy/)).toBeDefined();
    expect(queryByText(/Download/)).toBeFalsy();
    expect(queryByText(/Trash/)).toBeFalsy();
  });

  it('enables Empty button for files in .Trash', () => {
    const testFile = {
      name: 'test.txt',
      path: '/.Trash/test.txt',
      lastModified: '2020-08-01T00:00:00-05:00',
      type: 'file',
    };
    const { getByText } = renderComponent(
      <DataFilesToolbar scheme="private" api="tapis" />,
      mockStore({
        workbench: {
          config: {
            extract: '',
            compress: '',
            trashPath: '.Trash',
          },
        },
        files: {
          params: {
            FilesListing: {
              system: 'frontera.home.username',
              path: 'home/username/.Trash',
              scheme: 'private',
            },
          },
          listing: { FilesListing: [testFile] },
          selected: { FilesListing: [] },
          operationStatus: { trash: false },
        },
        systems: systemsFixture,
        projects: { metadata: [] },
        authenticatedUser: { user: { username: 'testuser' } },
      }),
      createMemoryHistory()
    );
    expect(getByText(/Empty/).closest('button')).not.toBeDisabled();
  });

  it('disables Empty button when .Trash is empty', () => {
    const { getByText } = renderComponent(
      <DataFilesToolbar scheme="private" api="tapis" />,
      mockStore({
        workbench: {
          config: {
            extract: '',
            compress: '',
            trashPath: '.Trash',
          },
        },
        files: {
          params: {
            FilesListing: {
              system: 'frontera.home.username',
              path: 'home/username/.Trash',
              scheme: 'private',
            },
          },
          listing: { FilesListing: [] },
          selected: { FilesListing: [] },
          operationStatus: { trash: false },
        },
        //listing: {  } },
        systems: systemsFixture,
        projects: { metadata: [] },
        authenticatedUser: { user: { username: 'testuser' } },
      }),
      createMemoryHistory()
    );
    expect(getByText(/Empty/).closest('button')).toBeDisabled();
  });
});
