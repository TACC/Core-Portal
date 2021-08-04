import React from 'react';
import { createMemoryHistory } from 'history';
import configureStore from 'redux-mock-store';
import { fireEvent, wait } from '@testing-library/react';
import renderComponent from 'utils/testing';
import DataFilesListing from './DataFilesListing';
import { CheckboxCell, FileNavCell } from './DataFilesListingCells';
import systemsFixture from '../fixtures/DataFiles.systems.fixture';
import filesFixture from '../fixtures/DataFiles.files.fixture';

const mockStore = configureStore();
const initialMockState = {
  pushKeys: {
    target: {}
  },
  files: {
    loading: {
      FilesListing: false
    },
    params: {
      FilesListing: {
        system: 'test.system',
        path: 'test/path'
      }
    },
    loadingScroll: {
      FilesListing: false
    },
    error: {
      FilesListing: false
    },
    listing: {
      FilesListing: []
    },
    selected: {
      FilesListing: []
    },
    selectAll: {
      FilesListing: false
    },
    reachedEnd: {
      FilesListing: true
    }
  },
  systems: systemsFixture
};

describe('CheckBoxCell', () => {
  it('shows checkbox when checked', () => {
    const history = createMemoryHistory();
    const store = mockStore({ files: { selected: { FilesListing: [0] } } });
    const { getAllByRole } = renderComponent(
      <CheckboxCell index={0} />,
      store,
      history
    );
    expect(
      getAllByRole('img', { hidden: true })[1].getAttribute('data-icon')
    ).toEqual('check-square');
  });

  it('shows square when unchecked', () => {
    const history = createMemoryHistory();
    const store = mockStore({ files: { selected: { FilesListing: [] } } });
    const { getAllByRole } = renderComponent(
      <CheckboxCell index={0} />,
      store,
      history
    );
    expect(
      getAllByRole('img', { hidden: true })
        .pop()
        .getAttribute('data-icon')
    ).toEqual('square');
  });
});

describe('FileNavCell', () => {
  it('renders name and link for dir', () => {
    const history = createMemoryHistory();
    const store = mockStore({});
    const { getByText } = renderComponent(
      <FileNavCell
        system="test.system"
        path="/path/to/file"
        name="Filename"
        format="folder"
        api="tapis"
        scheme="private"
        href="href"
      />,
      store,
      history
    );
    expect(getByText('Filename')).toBeDefined();
    expect(
      getByText('Filename')
        .closest('a')
        .getAttribute('href')
    ).toEqual('/workbench/data/tapis/private/test.system/path/to/file/');
  });

  it('renders name if not directory', () => {
    const history = createMemoryHistory();
    const store = mockStore({});
    const { getByText } = renderComponent(
      <FileNavCell
        system="test.system"
        path="/path/to/file"
        name="Filename"
        format="file"
        api="tapis"
        scheme="private"
        href="href"
      />,
      store,
      history
    );
    expect(getByText('Filename')).toBeDefined();
  });
});

describe('DataFilesListing', () => {
  it('renders listing', () => {
    const testfile = {
      system: 'test.system',
      path: '/path/to/file',
      name: 'testfile',
      format: 'file',
      length: 4096,
      lastModified: '2019-06-17T15:49:53-05:00',
      _links: { self: { href: 'href.test' } }
    };
    const history = createMemoryHistory();
    history.push('/workbench/data/tapis/private/test.system/');
    const store = mockStore({
      ...initialMockState,
      files: {
        ...initialMockState.files,
        listing: { FilesListing: [testfile] }
      }
    });

    const { getByText, getAllByRole } = renderComponent(
      <DataFilesListing
        api="tapis"
        scheme="private"
        system="test.system"
        resultCount={4}
        path="/"
      />,
      store,
      history
    );
    expect(getByText('testfile')).toBeDefined();
    expect(getByText('4.0 kB')).toBeDefined();
    /*
    expect(getByText("06/17/2019 15:49")).toBeDefined();
    const row = getAllByRole("row")[0];
    fireEvent.click(row);
    expect(store.getActions()).toEqual([
      { type: "DATA_FILES_TOGGLE_SELECT", payload: { index: 0, section: "FilesListing" } }
    ]);
    */
  });

  it('renders message when no files to show', () => {
    const history = createMemoryHistory();
    history.push('/workbench/data/tapis/private/test.system/');
    const store = mockStore(initialMockState);

    const { getByText, debug } = renderComponent(
      <DataFilesListing
        api="tapis"
        scheme="private"
        system="test.system"
        resultCount={4}
        path="/"
      />,
      store,
      history
    );

    expect(getByText(/No files or folders to show/)).toBeDefined();
  });

  it.each([
    ['500', /There was a problem accessing this file system./],
    [
      '502',
      /There was a problem accessing this file system. If this is your first time logging in/
    ],
    [
      '404',
      'The file or folder that you are attempting to access does not exist.'
    ]
  ])('Renders "%s" error message correctly', (errorCode, message) => {
    const history = createMemoryHistory();
    history.push('/workbench/data/tapis/private/test.system/');
    const errorMockState = { ...initialMockState };
    errorMockState.files.error.FilesListing = errorCode;
    const store = mockStore(errorMockState);

    const { getByText } = renderComponent(
      <DataFilesListing
        api="tapis"
        scheme="private"
        system="test.system"
        resultCount={4}
        path="/"
      />,
      store,
      history
    );

    expect(getByText(message)).toBeDefined();
  });

  it('filters by file type', () => {
    const store = mockStore({
      ...initialMockState,
      files: filesFixture
    });
    const history = createMemoryHistory();
    history.push('/workbench/data/tapis/private/test.system/');

    const { getByTestId, getAllByTestId } = renderComponent(
      <DataFilesListing
        api="tapis"
        scheme="private"
        system="frontera.home.username"
        path="/"
      />,
      store,
      history
    );

    const dropdownSelector = getByTestId('selector');
    fireEvent.change(dropdownSelector, { target: { value: 'Images' } });
    expect(getAllByTestId('file-listing-item').length).toBe(1);
    fireEvent.change(dropdownSelector, { target: { value: 'Code' } });
    expect(getAllByTestId('file-listing-item').length).toBe(2);
    fireEvent.change(dropdownSelector, { target: { value: 'Folders' } });
    expect(getAllByTestId('file-listing-item').length).toBe(4);
  })
});
