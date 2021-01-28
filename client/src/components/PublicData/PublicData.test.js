import React from 'react';
import { createMemoryHistory } from 'history';
import configureStore from 'redux-mock-store';
import PublicData from './PublicData';
import filesFixture from '../DataFiles/fixtures/DataFiles.files.fixture';
import systemsFixture from '../DataFiles/fixtures/DataFiles.systems.fixture';
import renderComponent from 'utils/testing';

const mockStore = configureStore();

const systems = {
  ...systemsFixture,
  storage: {
    ...systemsFixture.storage,
    configuration: [
      {
        name: 'Public Data',
        system: 'cep.storage.public',
        scheme: 'public',
        api: 'tapis',
        icon: null
      }
    ]
  }
};

describe('PublicData', () => {
  it('renders breadcrumb', () => {
    const history = createMemoryHistory();
    history.push('/public-data');
    const store = mockStore({
      systems,
      files: filesFixture,
      projects: {
        listing: {
          projects: []
        },
        metadata: {
          title: ''
        }
      },
      pushKeys: { target: {} }
    });
    const { getByText } = renderComponent(<PublicData />, store, history);

    expect(getByText(/Public Data/)).toBeDefined();
    expect(history.location.pathname).toEqual(
      '/public-data/tapis/public/cep.storage.public/'
    );
  });
});
