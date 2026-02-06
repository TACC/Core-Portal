import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import renderComponent from 'utils/testing';
import systemsFixture from '../fixtures/DataFiles.systems.fixture';
import BreadcrumbsDropdown from './DataFilesDropdown';

const mockStore = configureMockStore();

describe('BreadcrumbsDropdown', () => {
  it('renders "Go to ..." dropdown and can be toggled', () => {
    const store = mockStore({
      systems: systemsFixture,
    });

    const { getByText } = renderComponent(
      <BreadcrumbsDropdown
        api="tapis"
        scheme="private"
        system="frontera.home.username"
        path="/path/to/files"
      />,
      store
    );

    const dropdownToggle = getByText('Go to ...');
    expect(dropdownToggle).toBeDefined();

    // Toggle dropdown
    fireEvent.click(dropdownToggle);

    // Now, dropdown content should be visible
    expect(getByText('to')).toBeDefined();
    expect(getByText('path')).toBeDefined();
  });

  it('renders root path correctly', () => {
    const store = mockStore({
      systems: systemsFixture,
    });

    const { getByText } = renderComponent(
      <BreadcrumbsDropdown
        api="tapis"
        scheme="private"
        system="frontera.home.username"
        path="/"
      />,
      store
    );

    const dropdownToggle = getByText('Go to ...');
    fireEvent.click(dropdownToggle);

    // Check if the root path is rendered correctly
    expect(getByText('frontera.home.username')).toBeDefined();
  });
});
