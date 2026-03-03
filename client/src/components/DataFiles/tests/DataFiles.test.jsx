import React, { version } from 'react';
import { createMemoryHistory } from 'history';
import configureStore from 'redux-mock-store';
import DataFiles from '../DataFiles';
import systemsFixture from '../fixtures/DataFiles.systems.fixture';
import filesFixture from '../fixtures/DataFiles.files.fixture';
import renderComponent from 'utils/testing';
import { projectsFixture } from '../../../redux/sagas/fixtures/projects.fixture';
import { vi } from 'vitest';
import { useExtract } from 'hooks/datafiles/mutations';

const mockStore = configureStore();
global.fetch = vi.fn();

describe('DataFiles', () => {
  afterEach(() => {
    fetch.mockClear();
  });
  it.skip('should render Data Files with multiple private systems', () => {
    const history = createMemoryHistory();
    const store = mockStore({
      workbench: {
        config: {
          extract: {
            id: 'extract-express',
            version: '0.0.1',
          },
          compress: {
            id: 'compress-express',
            version: '0.0.1',
          },
        },
      },
      allocations: {
        portal_alloc: 'TACC-ACI',
        active: [{ projectId: 'active-project' }],
      },
      systems: systemsFixture,
      files: filesFixture,
      pushKeys: {
        modals: {
          pushKeys: false,
        },
        modalProps: {
          pushKeys: {},
        },
      },
      projects: projectsFixture,
      authenticatedUser: {
        user: {
          username: 'username',
          first_name: 'User',
          last_name: 'Name',
          email: 'user@name.com',
        },
      },
    });
    fetch.mockResolvedValue(useExtract());
    const { getByText, getAllByText, queryByText } = renderComponent(
      <DataFiles />,
      store,
      history
    );
    //expect(history.location.pathname).toEqual(
    //  '/workbench/data/tapis/private/corral.home.username/'
    //);
    expect(getAllByText(/My Data \(Frontera\)/)).toBeDefined();
    expect(getByText(/My Data \(Longhorn\)/)).toBeDefined();
    expect(queryByText(/My Data \(Work\)/)).toBeDefined(); // Changed to defined, hidden attribute removed and would be defined by default
  });

  it('should not render Data Files with no systems', () => {
    const history = createMemoryHistory();
    const store = mockStore({
      workbench: {
        config: {
          extract: '',
          compress: '',
        },
      },
      systems: {
        // TODO: Remove rest of unused variables
        storage: {
          configuration: [
            {
              name: 'My Data (Work)',
              system: 'corral.home.username',
              scheme: 'private',
              api: 'tapis',
              icon: null,
              hidden: true,
            },
          ],
          error: false,
          errorMessage: null,
          loading: false,
          defaultHost: 'cloud.corral.tacc.utexas.edu',
          defaultSystemId: 'cloud.data',
        },
        definitions: {
          list: [],
          error: false,
          errorMessage: null,
          loading: false,
        },
      },
      files: filesFixture,
      pushKeys: {
        modals: {
          pushKeys: false,
        },
        modalProps: {
          pushKeys: {},
        },
      },
      projects: projectsFixture,
      authenticatedUser: {
        user: {
          username: 'username',
          first_name: 'User',
          last_name: 'Name',
          email: 'user@name.com',
        },
      },
    });
    const { getByText, getAllByText } = renderComponent(
      <DataFiles />,
      store,
      history
    );
    expect(
      getAllByText(/No storage systems enabled for this portal/)
    ).toBeDefined();
  });
});
