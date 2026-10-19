import React from 'react';
import configureStore from 'redux-mock-store';
import { screen, waitFor } from '@testing-library/react';
import renderComponent, { workbenchConfig } from 'utils/testing';
import PublishedDatasetsBrowse from './PublishedDatasetsBrowse';

const mockStore = configureStore();

const publication = (id, title, isIndexable) => ({
  id,
  title,
  authors: [{ first_name: 'Ada', last_name: 'Lovelace' }],
  cover_image: 'cover.png',
  is_indexable: isIndexable,
});

describe('PublishedDatasetsBrowse', () => {
  it('leaves out a first publish that is still in progress', () => {
    const store = mockStore({
      publications: {
        listing: {
          loading: false,
          error: null,
          publications: [
            publication('drp.project.published.DRP-1', 'Live dataset', true),
            publication('drp.project.published.DRP-2', 'In progress', false),
            // Listings from before the flag existed are still shown.
            publication('drp.project.published.DRP-3', 'Unflagged dataset'),
          ],
        },
      },
      systems: { storage: { configuration: [] } },
    });
    const config = {
      ...workbenchConfig,
      config: { ...workbenchConfig.config, debug: false },
    };

    renderComponent(<PublishedDatasetsBrowse />, store, undefined, config);

    expect(screen.getByText('Live dataset')).toBeDefined();
    expect(screen.getByText('Unflagged dataset')).toBeDefined();
    expect(screen.queryByText('In progress')).toBeNull();
  });

  it('leaves out publications without a cover image in debug', async () => {
    const store = mockStore({
      publications: {
        listing: {
          loading: false,
          error: null,
          publications: [
            {
              ...publication('drp.project.published.DRP-1', 'No cover', true),
              cover_image: '',
            },
            {
              ...publication('drp.project.published.DRP-2', 'Default', true),
              cover_image: 'media/default/cover_image/default_logo.png',
            },
          ],
        },
      },
      systems: { storage: { configuration: [] } },
    });
    const config = {
      ...workbenchConfig,
      config: { ...workbenchConfig.config, debug: true },
    };

    renderComponent(<PublishedDatasetsBrowse />, store, undefined, config);

    // The spinner clears once every cover image has been checked.
    await waitFor(() =>
      expect(screen.queryByTestId('loading-spinner')).toBeNull()
    );
    expect(screen.queryByText('No cover')).toBeNull();
    expect(screen.queryByText('Default')).toBeNull();
    expect(document.querySelector('.c-card-list')).toBeNull();
  });
});
