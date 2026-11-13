import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import configureStore from 'redux-mock-store';
import { server } from '@tacc/test-fixtures';
import { http, HttpResponse } from 'msw';
import renderComponent from 'utils/testing';
import DataFilesProjectReview from './DataFilesProjectReview';

const mockStore = configureStore();

const request = {
  projectId: 'DRP-1',
  title: 'Dataset',
  description: 'A description',
  cover_image: 'cover.png',
  created: '2026-01-01T00:00:00Z',
  members: [],
  authors: [],
};

const renderReview = (metadata) => {
  const store = mockStore({
    projects: { metadata },
    publications: { operation: {} },
  });
  renderComponent(
    <DataFilesProjectReview rootSystem="root" system="system" />,
    store
  );
};

const continueFromDescription = async (user) => {
  await screen.findByText('Proofread Dataset');
  await user.click(screen.getAllByRole('button', { name: 'Continue' })[0]);
};

describe('DataFilesProjectReview', () => {
  it('blocks a request with no license at the description step', async () => {
    server.use(
      http.get('/api/projects/:projectId/tree/', () =>
        HttpResponse.json({ tree: [] })
      )
    );
    const user = userEvent.setup();
    renderReview(request);

    await continueFromDescription(user);

    expect(await screen.findByText('License is required')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Back' })
    ).not.toBeInTheDocument();
  });

  it('continues past the description step once a license is set', async () => {
    server.use(
      http.get('/api/projects/:projectId/tree/', () =>
        HttpResponse.json({ tree: [] })
      )
    );
    const user = userEvent.setup();
    renderReview({ ...request, license: 'ODC-BY 1.0' });

    await continueFromDescription(user);

    expect(
      (await screen.findAllByRole('button', { name: 'Back' })).length
    ).toBeGreaterThan(0);
    expect(screen.queryByText('License is required')).not.toBeInTheDocument();
  });
});
