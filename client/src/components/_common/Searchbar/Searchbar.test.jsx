import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { createMemoryHistory } from 'history';
import configureStore from 'redux-mock-store';
import renderComponent from 'utils/testing';
import Searchbar from './Searchbar';
import systemsFixture from '../../DataFiles/fixtures/DataFiles.systems.fixture';

const mockStore = configureStore();

describe('Searchbar', () => {
  it('submits', () => {
    const history = createMemoryHistory();
    history.push('/workbench/data/test-api/test-scheme/test-system/');
    const store = mockStore({
      systems: systemsFixture,
      files: {
        error: {},
        loading: {},
      },
    });

    const { getByRole } = renderComponent(
      <Searchbar api="test-api" scheme="test-scheme" system="test-system" />,
      store,
      history
    );

    const form = getByRole('form');
    const input = getByRole('searchbox');

    fireEvent.change(input, { target: { value: 'querystring' } });
    fireEvent.submit(form);

    expect(history.location.pathname).toEqual(
      '/workbench/data/test-api/test-scheme/test-system/'
    );
    expect(history.location.search).toEqual(`?query_string=querystring`);
  });

  it('does not show dropdown filter selector when filterTypes passed in', () => {
    const history = createMemoryHistory();
    history.push('/workbench/data/tapis/test-scheme/test-system/');
    const store = mockStore({
      systems: systemsFixture,
      files: {
        error: {},
        loading: {},
      },
    });
    const { queryByTestId } = renderComponent(
      <Searchbar api="tapis" scheme="test-scheme" system="test-system" />,
      store,
      history
    );

    const dropdownSelector = queryByTestId('selector');

    expect(dropdownSelector).not.toBeInTheDocument();
  });

  it('shows dropdown filter selector when filterTypes passed in', () => {
    const history = createMemoryHistory();
    history.push('/workbench/data/tapis/test-scheme/test-system/');
    const store = mockStore({
      systems: systemsFixture,
      files: {
        error: {},
        loading: {},
      },
    });
    const { getByTestId } = renderComponent(
      <Searchbar
        api="tapis"
        scheme="test-scheme"
        system="test-system"
        filterTypes={['test-filter-1', 'test-filter-2']}
      />,
      store,
      history
    );

    const dropdownSelector = getByTestId('selector');

    expect(dropdownSelector).toBeDefined();
  });

  it('changes route on dropdown select', () => {
    const history = createMemoryHistory();
    history.push('/workbench/data/tapis/test-scheme/test-system/');
    const store = mockStore({
      systems: systemsFixture,
      files: {
        error: {},
        loading: {},
      },
    });
    const { getByTestId } = renderComponent(
      <Searchbar
        api="tapis"
        scheme="test-scheme"
        system="test-system"
        filterTypes={['Images']}
      />,
      store,
      history
    );
    const dropdownSelector = getByTestId('selector');
    fireEvent.change(dropdownSelector, { target: { value: 'Images' } });
    expect(history.location.search).toEqual(`?filter=Images`);
  });

  it('clears field on route change', async () => {
    // Render the searchbar with a query string in the URL, then navigate away.
    const history = createMemoryHistory();
    history.push(
      '/workbench/data/api/scheme/system/path/?query_string=testquery'
    );
    const store = mockStore({
      systems: systemsFixture,
      files: {
        error: {},
        loading: {},
      },
    });
    const { getByRole } = renderComponent(
      <Searchbar api="test-api" scheme="test-scheme" system="test-system" />,
      store,
      history
    );
    let input = getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'testquery' } });
    expect(input.value).toBe('testquery');

    await waitFor(() =>
      history.push('/workbench/data/api/scheme/system2/path/')
    );

    input = getByRole('searchbox');
    expect(input.value).toBe('');
  });

  it('shows correct label when dataType is Files', async () => {
    const history = createMemoryHistory();
    history.push('/workbench/data/test-api/test-scheme/test-system/');
    const store = mockStore({
      systems: systemsFixture,
      files: {
        error: {},
        loading: {},
      },
    });
    const { getByTestId, getByRole } = renderComponent(
      <Searchbar
        api="test-api"
        scheme="test-scheme"
        system="test-system"
        filterTypes={['test-filter-1', 'test-filter-2']}
        dataType="Files"
      />,
      store,
      history
    );

    const form = getByRole('form');
    const input = getByRole('searchbox');

    fireEvent.change(input, { target: { value: 'querystring' } });
    fireEvent.submit(form);

    const element = getByTestId('clear-button');

    expect(element.textContent).toBe('Back to All Files');
  });

  it('shows correct label when no dataType is sent', async () => {
    const history = createMemoryHistory();
    history.push('/workbench/data/test-api/test-scheme/test-system/');
    const store = mockStore({
      systems: systemsFixture,
      files: {
        error: {},
        loading: {},
      },
    });
    const { getByTestId, getByRole } = renderComponent(
      <Searchbar
        api="test-api"
        scheme="test-scheme"
        system="test-system"
        filterTypes={['test-filter-1', 'test-filter-2']}
      />,
      store,
      history
    );

    const form = getByRole('form');
    const input = getByRole('searchbox');

    fireEvent.change(input, { target: { value: 'querystring' } });
    fireEvent.submit(form);

    const element = getByTestId('clear-button');

    expect(element.textContent).toBe('Back to All Results');
  });

  it('has expected elements', () => {
    const history = createMemoryHistory();
    history.push(
      '/workbench/data/api/scheme/system/path?query_string=testquery'
    );
    const store = mockStore({
      systems: systemsFixture,
      files: {
        error: {},
        loading: {},
      },
    });
    const { getByRole, getByTestId, getByPlaceholderText } = renderComponent(
      <Searchbar
        api="tapis"
        scheme="private"
        system="frontera.home.username"
        resultCount={4}
        filterTypes={['test-filter-1', 'test-filter-2']}
      />,
      store,
      history
    );

    expect(getByRole('form')).toBeDefined();
    expect(getByRole('searchbox')).toBeDefined();
    expect(getByTestId('selector')).toBeDefined();
    expect(getByTestId('summary-of-search-results')).toBeDefined();
    expect(
      getByTestId('summary-of-search-results').getAttribute('class')
    ).not.toMatch(/hidden/);
    expect(getByPlaceholderText('Search My Data (Frontera)')).toBeDefined();
  });

  it('has hides results when disabled', () => {
    const history = createMemoryHistory();
    history.push(
      '/workbench/data/api/scheme/system/path?query_string=testquery'
    );
    const store = mockStore({
      systems: systemsFixture,
      files: {
        error: {},
        loading: {},
      },
    });
    const { getByRole, getByTestId, getByPlaceholderText } = renderComponent(
      <Searchbar
        api="tapis"
        scheme="private"
        system="frontera.home.username"
        resultCount={0}
        disabled
        filterTypes={['test-filter-1', 'test-filter-2']}
      />,
      store,
      history
    );

    expect(getByRole('form')).toBeDefined();
    expect(getByRole('searchbox')).toBeDefined();
    expect(getByTestId('selector')).toBeDefined();
    expect(
      getByTestId('summary-of-search-results').getAttribute('class')
    ).toMatch(/hidden/);
    expect(getByPlaceholderText('Search My Data (Frontera)')).toBeDefined();
  });
});
