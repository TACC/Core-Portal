import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { render, fireEvent, wait } from '@testing-library/react';
import { Provider } from 'react-redux';
import DataFilesTable from './DataFilesTable';
import filesFixture from '../fixtures/DataFiles.files.fixture';
import systemsFixture from '../fixtures/DataFiles.systems.fixture';

const mockStore = configureStore();
const initialMockState = {
  pushKeys: {
    target: {}
  },
  files: {
    ...filesFixture,
    refs: {
      FileSelector: {
        props: {
          toggle: jest.fn()
        }
      }
    },
  },
  systems: systemsFixture,
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
    width: 0.15 
  },
  {
    Header: 'Last Modified',
    accessor: 'lastModified',
    width: 0.15
  },
  {
    Header: 'Path',
    width: 0.1,
  }
];

describe('DataFilesTable', () => {
  const mockCallback = jest.fn();
  const store = mockStore(initialMockState);

  let getByText, rerender;
  beforeEach(() => {
    ({getByText, rerender} = render(
        <Provider store={store}>
          <BrowserRouter>
            <DataFilesTable
              data={filesFixture.listing.FilesListing}
              columns={columns}
              rowSelectCallback={mockCallback}
              scrollBottomCallback={mockCallback}
              section="FilesListing"/>,
          </BrowserRouter>
        </Provider>
    ));
  });

  it("should have relevant columns for data for the Data Files Table", () => {
    expect(getByText(/^Name/)).toBeDefined();
    expect(getByText(/^Size/)).toBeDefined();
    expect(getByText(/^Last Modified/)).toBeDefined();
    expect(getByText(/^Path/)).toBeDefined();
  });

  it('should display an error for 502', async () => {
    const storeWithError = mockStore({
      ...initialMockState,
      files: {
        ...initialMockState.files,
        error: {
          FilesListing: '502'
        },
        params: {
          FilesListing: {
            system: 'test.system',
            path: 'test/path',
            scheme: 'public'
          }
        },
      },
    });
    rerender(
      <Provider store={storeWithError}>
        <BrowserRouter>
          <DataFilesTable
            data={filesFixture.listing.FilesListing}
            columns={columns}
            rowSelectCallback={mockCallback}
            scrollBottomCallback={mockCallback}
            section="FilesListing"/>,
        </BrowserRouter>
      </Provider>
    );
    expect(getByText(/An error occurred loading this directory. For help, please submit/)).toBeDefined();
  });

  it('should display an error for 404', async () => {
    const storeWithError = mockStore({
      ...initialMockState,
      files: {
        ...initialMockState.files,
        error: {
          FilesListing: '404'
        },
        params: {
          FilesListing: {
            system: 'test.system',
            path: 'test/path',
            scheme: 'public'
          }
        },
      },
    });
    rerender(
      <Provider store={storeWithError}>
        <BrowserRouter>
          <DataFilesTable
            data={filesFixture.listing.FilesListing}
            columns={columns}
            rowSelectCallback={mockCallback}
            scrollBottomCallback={mockCallback}
            section="FilesListing"/>,
        </BrowserRouter>
      </Provider>
    );
    expect(getByText(/The file or folder that you are attempting to access does not exist./)).toBeDefined();
  });

  it('should display an error for 403', async () => {
    const storeWithError = mockStore({
      ...initialMockState,
      files: {
        ...initialMockState.files,
        error: {
          FilesListing: '403'
        },
        params: {
          FilesListing: {
            system: 'test.system',
            path: 'test/path',
            scheme: 'public'
          }
        },
      },
    });
    rerender(
      <Provider store={storeWithError}>
        <BrowserRouter>
          <DataFilesTable
            data={filesFixture.listing.FilesListing}
            columns={columns}
            rowSelectCallback={mockCallback}
            scrollBottomCallback={mockCallback}
            section="FilesListing"/>,
        </BrowserRouter>
      </Provider>
    );
    expect(getByText(/You are missing the required allocation for this system./)).toBeDefined();
  });

  it('should display an error for 400 when the api is Google Drive', async () => {
    const storeWithError = mockStore({
      ...initialMockState,
      files: {
        ...initialMockState.files,
        error: {
          FilesListing: '400'
        },
        params: {
          FilesListing: {
            system: 'test.system',
            path: 'test/path',
            scheme: 'public',
            api: 'googledrive'
          }
        },
      },
    });
    rerender(
      <Provider store={storeWithError}>
        <BrowserRouter>
          <DataFilesTable
            data={filesFixture.listing.FilesListing}
            columns={columns}
            rowSelectCallback={mockCallback}
            scrollBottomCallback={mockCallback}
            section="FilesListing"/>,
        </BrowserRouter>
      </Provider>
    );
    expect(getByText(/Connect your Google Drive account under the/)).toBeDefined();
  });

  it('should display an error for no data', async () => {
    const storeWithError = mockStore({
      ...initialMockState,
      files: {
        ...initialMockState.files,
        error: {
          FilesListing: false
        },
        params: {
          FilesListing: {
            system: 'test.system',
            path: 'test/path',
            scheme: 'private',
          }
        },
      },
    });
    rerender(
      <Provider store={storeWithError}>
        <BrowserRouter>
          <DataFilesTable
            data={[]}
            columns={columns}
            rowSelectCallback={mockCallback}
            scrollBottomCallback={mockCallback}
            section="FilesListing"/>,
        </BrowserRouter>
      </Provider>
    );
    expect(getByText(/No files or folders to show./)).toBeDefined();
  });

  it('should fire push keys dispatch event on click', async () => {
    const storeWithError = mockStore({
      ...initialMockState,
      files: {
        ...initialMockState.files,
        error: {
          FilesListing: '502'
        },
        params: {
          FilesListing: {
            system: 'test.system',
            path: 'test/path',
            scheme: 'private'
          }
        },
      },
    });
    rerender(
      <Provider store={storeWithError}>
        <BrowserRouter>
          <DataFilesTable
            data={filesFixture.listing.FilesListing}
            columns={columns}
            rowSelectCallback={mockCallback}
            scrollBottomCallback={mockCallback}
            section="FilesListing"/>,
        </BrowserRouter>
      </Provider>
    );

    expect(getByText(/There was a problem accessing this file system./)).toBeDefined();

    fireEvent.click(getByText(/push your keys/));
    await wait(() => {
      expect(storeWithError.getActions()).toEqual([{
        type: 'SYSTEMS_TOGGLE_MODAL',
        payload: {
          operation: 'pushKeys',
          props: {
            callback: expect.any(Function), 
            onSuccess: expect.any(Object),
            system: expect.any(Object)
          }
        }
      }]);
    });
  });
});
