import React from 'react';
import configureStore from 'redux-mock-store';
import renderComponent from 'utils/testing';
import AppBrowser from './AppBrowser';
import { initialState } from '../../../redux/reducers/apps.reducers';
import applicationsFixture from '../../../redux/sagas/fixtures/applications.fixtures';

const mockStore = configureStore();

describe('App Browser', () => {
  it('should render App Browser with different categories and app counts', () => {
    const store = mockStore({
      apps: { ...initialState, categoryApps: applicationsFixture }
    });
    const { getByText } = renderComponent(<AppBrowser />, store);

    expect(getByText('Data Processing [1]')).toBeDefined();
    expect(getByText('Simulation [1]')).toBeDefined();
    expect(getByText('Visualization [1]')).toBeDefined();
    expect(getByText('My Apps [1]')).toBeDefined();
  });

  it('should have selected category and populate app list when viewing specific app', () => {
    const store = mockStore({
      apps: { ...initialState, categoryApps: applicationsFixture }
    });
    const { getByText } = renderComponent(<AppBrowser />, store);

    expect(getByText('jupyter')).toBeDefined();
  });
});
