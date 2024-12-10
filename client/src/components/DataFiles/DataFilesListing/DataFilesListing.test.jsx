import React from 'react';
import { vi } from 'vitest';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import configureStore from 'redux-mock-store';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import renderComponent from 'utils/testing';
import DataFilesListing from './DataFilesListing';
import * as DataFilesModalListingTable from '../DataFilesModals/DataFilesModalTables/DataFilesModalListingTable';
import { CheckboxCell, FileNavCell } from './DataFilesListingCells';
import systemsFixture from '../fixtures/DataFiles.systems.fixture';
import filesFixture from '../fixtures/DataFiles.files.fixture';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const mockStore = configureStore();
const initialMockState = {
  pushKeys: {
    target: {},
  },
  files: {
    loading: {
      FilesListing: false,
    },
    params: {
      FilesListing: {
        system: 'test.system',
        path: 'test/path',
        scheme: 'private',
      },
    },
    loadingScroll: {
      FilesListing: false,
    },
    error: {
      FilesListing: false,
    },
    listing: {
      FilesListing: [],
    },
    selected: {
      FilesListing: [],
    },
    selectAll: {
      FilesListing: false,
    },
    reachedEnd: {
      FilesListing: true,
    },
    operationStatus: {
      trash: false,
    },
  },
  systems: systemsFixture,
  workbench: {
    config: {
      trashPath: '.Trash',
    },
  },
  authenticatedUser: { user: { username: 'username' } },
};

describe('CheckBoxCell', () => {
  it('box is checked when selected', () => {
    const history = createMemoryHistory();
    const store = mockStore({ files: { selected: { FilesListing: [0] } } });
    const { getByRole } = renderComponent(
      <CheckboxCell index={0} name="Foldername" format="folder" />,
      store,
      history
    );
    expect(getByRole('checkbox').getAttribute('aria-checked')).toEqual('true');
  });

  it('box is unchecked when not selected', () => {
    const history = createMemoryHistory();
    const store = mockStore({ files: { selected: { FilesListing: [] } } });
    const { getByRole } = renderComponent(
      <CheckboxCell index={0} name="Filename" format="file" />,
      store,
      history
    );
    expect(getByRole('checkbox').getAttribute('aria-checked')).toEqual('false');
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
        length={1234}
      />,
      store,
      history
    );
    expect(getByText('Filename')).toBeDefined();
    expect(getByText('Filename').closest('a').getAttribute('href')).toEqual(
      '/workbench/data/tapis/private/test.system/path/to/file/'
    );
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
        length={1234}
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
      _links: { self: { href: 'href.test' } },
    };
    const history = createMemoryHistory();
    history.push('/workbench/data/tapis/private/test.system/');
    const store = mockStore({
      ...initialMockState,
      files: {
        ...initialMockState.files,
        listing: { FilesListing: [testfile] },
      },
    });

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
    expect(getByText('testfile')).toBeDefined();
    expect(getByText('4.0 kB')).toBeDefined();
  });

  it('renders message when no files to show', () => {
    const history = createMemoryHistory();
    history.push('/workbench/data/tapis/private/test.system/');
    const store = mockStore(initialMockState);

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

    expect(getByText(/No files or folders to show/)).toBeDefined();
  });

  it.each([
    ['503', /There was a problem accessing this file system./, 'private'],
    [
      '500',
      /An error occurred loading this directory. For help, please submit/,
      'public',
    ],
    ['500', /There was a problem accessing this file system./, 'private'],
    [
      '404',
      'The file or folder that you are attempting to access does not exist.',
      'private',
    ],
  ])(
    'Renders "%s %s %s" error message correctly',
    (errorCode, message, scheme) => {
      const history = createMemoryHistory();
      history.push('/workbench/data/tapis/private/frontera.home.username/');
      const errorMockState = { ...initialMockState, files: filesFixture };
      errorMockState.files.error.FilesListing = errorCode;
      errorMockState.files.params.FilesListing.scheme = scheme;
      const store = mockStore(errorMockState);

      const { getByText } = renderComponent(
        <DataFilesListing
          api="tapis"
          scheme="private"
          system="frontera.home.username"
          resultCount={4}
          path="/"
        />,
        store,
        history
      );

      expect(getByText(message)).toBeDefined();
    }
  );

  it('does not render the DataFilesSearchbar in the Shared Workspaces component when hideSearchBar is true', () => {
    const history = createMemoryHistory();
    history.push('/workbench/data/tapis/projects/');

    systemsFixture.storage.configuration[5].hideSearchBar = true;

    const store = mockStore({
      ...initialMockState,
      systems: systemsFixture,
    });

    const { queryByText } = render(
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <BrowserRouter history={history}>
            <DataFilesListing
              api="tapis"
              scheme="projects"
              system="test.system"
              resultCount={0}
              path="/"
              isPublic={false}
            />
          </BrowserRouter>
        </Provider>
      </QueryClientProvider>
    );
    expect(queryByText(/Search/)).toBeNull();
  });
});

describe('DataFilesListing - Section Name Determination', () => {
  const mockStore = configureStore();
  const store = mockStore(initialMockState);

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  it('sets sectionName to systemDisplayName when path is homeDir', () => {
    vi.spyOn(
      DataFilesModalListingTable,
      'getCurrentDirectory'
    ).mockImplementationOnce(() => 'Mock System Name');

    const { getByPlaceholderText } = render(
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <BrowserRouter>
            <DataFilesListing
              api="tapis"
              scheme="private"
              system="test.system"
              path="/home/user" // Same as homeDir
            />
          </BrowserRouter>
        </Provider>
      </QueryClientProvider>
    );

    expect(getByPlaceholderText('Search Mock System Name')).toBeInTheDocument();
  });

  it('sets sectionName to current directory name when path is not homeDir', () => {
    const currentDirName = 'Current Directory Name';
    vi.spyOn(
      DataFilesModalListingTable,
      'getCurrentDirectory'
    ).mockImplementationOnce(() => currentDirName);

    const { getByPlaceholderText } = render(
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <BrowserRouter>
            <DataFilesListing
              api="tapis"
              scheme="private"
              system="test.system"
              path="/home/user/some/other/dir" // Different from homeDir
            />
          </BrowserRouter>
        </Provider>
      </QueryClientProvider>
    );

    expect(
      getByPlaceholderText(`Search ${currentDirName}`)
    ).toBeInTheDocument();
  });
});
describe('DataFilesListing - showViewPath', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it('renders the "Path" column when showViewPath is true', () => {
    const testfile = {
      system: 'test.system',
      path: '/path/to/file',
      name: 'testfile',
      format: 'file',
      length: 4096,
      lastModified: '2019-06-17T15:49:53-05:00',
      _links: { self: { href: 'href.test' } },
    };
    const history = createMemoryHistory();
    history.push('/workbench/data/tapis/private/test.system/');
    const store = mockStore({
      ...initialMockState,
      files: {
        ...initialMockState.files,
        listing: { FilesListing: [testfile] },
      },
      workbench: {
        config: {
          viewPath: true,
        },
      },
    });
    // Spy on useMemo to capture the cells array
    const useMemoSpy = vi
      .spyOn(React, 'useMemo')
      .mockImplementation((fn) => fn());
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
    // Path cell is added
    expect(getByText('Path')).toBeDefined();
    // Check the length of the cells array
    const cellsArray = useMemoSpy.mock.results.find((result) =>
      Array.isArray(result.value)
    ).value;
    expect(cellsArray.length).toBe(6);
  });
  it('does not render the "Path" column when showViewPath is false', () => {
    const testfile = {
      system: 'test.system',
      path: '/path/to/file',
      name: 'testfile',
      format: 'file',
      length: 4096,
      lastModified: '2019-06-17T15:49:53-05:00',
      _links: { self: { href: 'href.test' } },
    };
    const history = createMemoryHistory();
    history.push('/workbench/data/tapis/private/test.system/');
    const store = mockStore({
      ...initialMockState,
      files: {
        ...initialMockState.files,
        listing: { FilesListing: [testfile] },
      },
      workbench: {
        config: {
          viewPath: false,
        },
      },
    });
    // Spy on useMemo to capture the cells array
    const useMemoSpy = vi
      .spyOn(React, 'useMemo')
      .mockImplementation((fn) => fn());
    const { queryByText } = renderComponent(
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
    // Path should not exist as a new cell
    expect(queryByText('Path')).toBeNull();
    // Check the length of the cells array
    const cellsArray = useMemoSpy.mock.results.find((result) =>
      Array.isArray(result.value)
    ).value;
    expect(cellsArray.length).toBe(5);
  });
});
