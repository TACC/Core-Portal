import React from 'react';
import { createMemoryHistory } from 'history';
import configureStore from 'redux-mock-store';
import PublicData from './PublicData';
import filesFixture from '../DataFiles/fixtures/DataFiles.files.fixture';
import renderComponent from 'utils/testing';

const mockStore = configureStore();

const systemsFixture = {
  defaultHost: 'frontera.tacc.utexas.edu',
  systemList: [
    {
      name: 'Public Data',
      system: 'cep.storage.public',
      scheme: 'public',
      api: 'tapis',
      icon: null
    }
  ],
  error: false,
  errorMessage: null
};

describe('PublicData', () => {
  it('renders breadcrumb', () => {
    const history = createMemoryHistory();
    history.push('/public-data');
    const store = mockStore({
      systems: systemsFixture,
      files: filesFixture,
      pushKeys: { target: {} }
    });
    console.log(filesFixture);
    const { getByText, getAllByText, debug } = renderComponent(
      <PublicData />,
      store,
      history
    );

    expect(getByText(/Public Data/)).toBeDefined();
    expect(history.location.pathname).toEqual(
      '/public-data/tapis/public/cep.storage.public/'
    );
  });
});
