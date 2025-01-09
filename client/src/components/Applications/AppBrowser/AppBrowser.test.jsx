import React from 'react';
import configureStore from 'redux-mock-store';
import renderComponent from 'utils/testing';
import AppBrowser from './AppBrowser';
import { appTrayExpectedFixture } from '../../../redux/sagas/fixtures/apptray.fixture';

const mockStore = configureStore();

describe('App Browser', () => {
  it('should render App Browser with different categories and app counts', () => {
    const store = mockStore({
      apps: appTrayExpectedFixture,
    });
    const { getByText } = renderComponent(<AppBrowser />, store);

    expect(getByText('Data Processing [3]')).toBeDefined();
    expect(getByText('Simulation [1]')).toBeDefined();
    expect(getByText('Visualization [1]')).toBeDefined();
    expect(getByText('My Apps [1]')).toBeDefined();
  });

  it('should have selected category and populate app list for that default/selected category', () => {
    const store = mockStore({
      apps: { ...appTrayExpectedFixture, defaultTab: 'Simulation' },
    });
    const { container, getByText } = renderComponent(<AppBrowser />, store);
    expect(
      getByText('Simulation [1]', { selector: '.active.nav-link .nav-text' })
    ).toBeDefined();
    expect(
      getByText('NAMD', { selector: '.tab-pane.active .nav-text' })
    ).toBeDefined();
  });
});
