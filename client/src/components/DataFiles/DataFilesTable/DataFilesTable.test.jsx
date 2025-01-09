import React from 'react';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import DataFilesTable from './DataFilesTable';
import filesFixture from '../fixtures/DataFiles.files.fixture';
import systemsFixture from '../fixtures/DataFiles.systems.fixture';
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
    ...filesFixture,
    refs: {
      FileSelector: {
        props: {
          toggle: vi.fn(),
        },
      },
    },
  },
  systems: systemsFixture,
  authenticatedUser: { user: { username: 'username' } },
};

const columns = [
  {
    id: 'checkbox',
    width: 0.05,
    minWidth: 20,
    maxWidth: 40,
  },
  {
    id: 'icon',
    accessor: 'format',
    width: 0.05,
    minWidth: 20,
    maxWidth: 25,
  },
  {
    Header: 'Name',
    accessor: 'name',
    width: 0.5,
  },
  {
    Header: 'Size',
    accessor: 'length',
    width: 0.15,
  },
  {
    Header: 'Last Modified',
    accessor: 'lastModified',
    width: 0.15,
  },
  {
    Header: 'Path',
    width: 0.1,
  },
];

describe('DataFilesTable', () => {
  const mockCallback = vi.fn();
  const store = mockStore(initialMockState);

  let getByText, rerender;
  beforeEach(() => {
    ({ getByText, rerender } = render(
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <BrowserRouter>
            <DataFilesTable
              data={filesFixture.listing.FilesListing}
              columns={columns}
              rowSelectCallback={mockCallback}
              scrollBottomCallback={mockCallback}
              section="FilesListing"
            />
            ,
          </BrowserRouter>
        </Provider>
      </QueryClientProvider>
    ));
  });

  it('should have relevant columns for data for the Data Files Table', () => {
    expect(getByText(/^Name/)).toBeDefined();
    expect(getByText(/^Size/)).toBeDefined();
    expect(getByText(/^Last Modified/)).toBeDefined();
    expect(getByText(/^Path/)).toBeDefined();
  });

  it('should display an error for 500', async () => {
    const storeWithError = mockStore({
      ...initialMockState,
      files: {
        ...initialMockState.files,
        error: {
          FilesListing: '500',
        },
        params: {
          FilesListing: {
            system: 'test.system',
            path: 'test/path',
            scheme: 'public',
          },
        },
      },
    });
    rerender(
      <QueryClientProvider client={queryClient}>
        <Provider store={storeWithError}>
          <BrowserRouter>
            <DataFilesTable
              data={filesFixture.listing.FilesListing}
              columns={columns}
              rowSelectCallback={mockCallback}
              scrollBottomCallback={mockCallback}
              section="FilesListing"
            />
            ,
          </BrowserRouter>
        </Provider>
      </QueryClientProvider>
    );
    expect(
      getByText(
        /An error occurred loading this directory. For help, please submit/
      )
    ).toBeDefined();
  });

  it('should display an error for 404', async () => {
    const storeWithError = mockStore({
      ...initialMockState,
      files: {
        ...initialMockState.files,
        error: {
          FilesListing: '404',
        },
        params: {
          FilesListing: {
            system: 'test.system',
            path: 'test/path',
            scheme: 'public',
          },
        },
      },
    });
    rerender(
      <QueryClientProvider client={queryClient}>
        <Provider store={storeWithError}>
          <BrowserRouter>
            <DataFilesTable
              data={filesFixture.listing.FilesListing}
              columns={columns}
              rowSelectCallback={mockCallback}
              scrollBottomCallback={mockCallback}
              section="FilesListing"
            />
            ,
          </BrowserRouter>
        </Provider>
      </QueryClientProvider>
    );
    expect(
      getByText(
        /The file or folder that you are attempting to access does not exist./
      )
    ).toBeDefined();
  });

  it('should display an error for 403', async () => {
    const storeWithError = mockStore({
      ...initialMockState,
      files: {
        ...initialMockState.files,
        error: {
          FilesListing: '403',
        },
        params: {
          FilesListing: {
            system: 'test.system',
            path: 'test/path',
            scheme: 'public',
          },
        },
      },
    });
    rerender(
      <QueryClientProvider client={queryClient}>
        <Provider store={storeWithError}>
          <BrowserRouter>
            <DataFilesTable
              data={filesFixture.listing.FilesListing}
              columns={columns}
              rowSelectCallback={mockCallback}
              scrollBottomCallback={mockCallback}
              section="FilesListing"
            />
            ,
          </BrowserRouter>
        </Provider>
      </QueryClientProvider>
    );
    expect(getByText(/You must be logged in to view this data./)).toBeDefined();
  });

  it('should display an error for 400 when the api is Google Drive', async () => {
    const storeWithError = mockStore({
      ...initialMockState,
      files: {
        ...initialMockState.files,
        error: {
          FilesListing: '400',
        },
        params: {
          FilesListing: {
            system: 'test.system',
            path: 'test/path',
            scheme: 'public',
            api: 'googledrive',
          },
        },
      },
    });
    rerender(
      <QueryClientProvider client={queryClient}>
        <Provider store={storeWithError}>
          <BrowserRouter>
            <DataFilesTable
              data={filesFixture.listing.FilesListing}
              columns={columns}
              rowSelectCallback={mockCallback}
              scrollBottomCallback={mockCallback}
              section="FilesListing"
            />
            ,
          </BrowserRouter>
        </Provider>
      </QueryClientProvider>
    );
    expect(
      getByText(/Connect your Google Drive account under the/)
    ).toBeDefined();
  });

  it('should display an error for no data', async () => {
    const storeWithError = mockStore({
      ...initialMockState,
      files: {
        ...initialMockState.files,
        error: {
          FilesListing: false,
        },
        params: {
          FilesListing: {
            system: 'test.system',
            path: 'test/path',
            scheme: 'private',
          },
        },
      },
    });
    rerender(
      <QueryClientProvider client={queryClient}>
        <Provider store={storeWithError}>
          <BrowserRouter>
            <DataFilesTable
              data={[]}
              columns={columns}
              rowSelectCallback={mockCallback}
              scrollBottomCallback={mockCallback}
              section="FilesListing"
            />
            ,
          </BrowserRouter>
        </Provider>
      </QueryClientProvider>
    );
    expect(getByText(/No files or folders to show./)).toBeDefined();
  });

  it('should fire push keys dispatch event on click', async () => {
    const storeWithError = mockStore({
      ...initialMockState,
      files: {
        ...initialMockState.files,
        error: {
          FilesListing: '500',
        },
        params: {
          FilesListing: {
            system: 'frontera.home.username',
            path: 'test/path',
            scheme: 'private',
          },
        },
      },
    });
    rerender(
      <QueryClientProvider client={queryClient}>
        <Provider store={storeWithError}>
          <BrowserRouter>
            <DataFilesTable
              data={filesFixture.listing.FilesListing}
              columns={columns}
              rowSelectCallback={mockCallback}
              scrollBottomCallback={mockCallback}
              section="FilesListing"
            />
            ,
          </BrowserRouter>
        </Provider>
      </QueryClientProvider>
    );

    expect(
      getByText(/There was a problem accessing this file system./)
    ).toBeDefined();

    fireEvent.click(getByText(/push your keys/));
    await waitFor(() => {
      expect(storeWithError.getActions()).toEqual([
        {
          type: 'GET_SYSTEM_MONITOR',
        },
        {
          type: 'SYSTEMS_TOGGLE_MODAL',
          payload: {
            operation: 'pushKeys',
            props: {
              callback: expect.any(Function),
              onSuccess: expect.any(Object),
              system: expect.any(Object),
            },
          },
        },
      ]);
    });
  });
});
